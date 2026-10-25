import { nextOccurrence, occurrenceId } from "./recurrence.helper";
import { RecurrenceService } from "./recurrence.service";

const anchor = new Date("2024-01-31T12:30:00.000Z");
describe("Recorrências", () => {
  it("preserva o dia original ao atravessar fevereiro", () => {
    const feb = nextOccurrence(anchor, anchor, "MONTHLY");
    expect(feb.toISOString()).toBe("2024-02-29T12:30:00.000Z");
    expect(nextOccurrence(feb, anchor, "MONTHLY").toISOString()).toBe(
      "2024-03-31T12:30:00.000Z",
    );
  });
  it("recupera o dia 29 no próximo ano bissexto", () => {
    const leap = new Date("2024-02-29T00:00:00Z");
    let date = leap;
    for (let i = 0; i < 4; i++) date = nextOccurrence(date, leap, "YEARLY");
    expect(date.toISOString()).toBe("2028-02-29T00:00:00.000Z");
  });
  it.each([
    ["DAILY", "2024-02-01T12:30:00.000Z"],
    ["WEEKLY", "2024-02-07T12:30:00.000Z"],
  ] as const)("calcula frequência %s em UTC", (frequency, date) => {
    expect(nextOccurrence(anchor, anchor, frequency).toISOString()).toBe(date);
  });

  function fixture(
    options: { claimed?: number; endsAt?: Date; category?: boolean } = {},
  ) {
    const series = {
      id: "507f1f77bcf86cd799439011",
      userId: "user",
      categoryId: "cat",
      type: "EXPENSE",
      amount: 10,
      description: "Conta",
      frequency: "MONTHLY",
      startsAt: anchor,
      nextDate: new Date("2024-02-29T12:30:00Z"),
      endsAt: options.endsAt ?? null,
    };
    const tx = {
      recurrence: {
        updateMany: jest
          .fn()
          .mockResolvedValue({ count: options.claimed ?? 1 }),
        update: jest.fn(),
      },
      category: {
        findFirst: jest
          .fn()
          .mockResolvedValue(options.category === false ? null : { id: "cat" }),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ id: "user" }) },
      transaction: { upsert: jest.fn() },
    };
    const prisma = {
      recurrence: {
        findMany: jest.fn().mockResolvedValue([series]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn((fn) => fn(tx)),
    };
    const service = new RecurrenceService(
      prisma as any,
      { get: () => "false" } as any,
    );
    return { series, tx, prisma, service };
  }
  it("gera ocorrência com ID determinístico e avança a série atomicamente", async () => {
    const { service, tx, series, prisma } = fixture();
    await service.runDue(new Date("2024-03-01T00:00:00Z"));
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.transaction.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: occurrenceId(series.id, series.nextDate) },
        create: expect.objectContaining({
          userId: "user",
          amount: 10,
          recurrenceId: series.id,
        }),
      }),
    );
    expect(tx.recurrence.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: series.id, active: true, nextDate: series.nextDate },
        data: { nextDate: new Date("2024-03-31T12:30:00Z"), active: true },
      }),
    );
  });
  it("não gera novamente quando outra instância avançou ou cancelou a série", async () => {
    const { service, tx } = fixture({ claimed: 0 });
    await service.runDue();
    expect(tx.transaction.upsert).not.toHaveBeenCalled();
  });
  it("encerra a série na última ocorrência inclusiva", async () => {
    const { service, tx } = fixture({
      endsAt: new Date("2024-02-29T12:30:00Z"),
    });
    await service.runDue();
    expect(tx.transaction.upsert).toHaveBeenCalledTimes(1);
    expect(tx.recurrence.updateMany.mock.calls[0][0].data.active).toBe(false);
  });
  it("não gera ocorrências depois da data final", async () => {
    const { service, tx } = fixture({
      endsAt: new Date("2024-02-01T00:00:00Z"),
    });
    await service.runDue();
    expect(tx.transaction.upsert).not.toHaveBeenCalled();
  });
  it("desativa a série quando categoria deixou de ser utilizável", async () => {
    const { service, tx } = fixture({ category: false });
    await service.runDue();
    expect(tx.transaction.upsert).not.toHaveBeenCalled();
    expect(tx.recurrence.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { active: false } }),
    );
  });
  it("não permite cancelar séries de outro usuário", async () => {
    const { service, prisma } = fixture();
    await expect(service.cancel("series", "other")).rejects.toMatchObject({
      status: 404,
    });
    expect(prisma.recurrence.updateMany).toHaveBeenCalledWith({
      where: { id: "series", userId: "other" },
      data: { active: false },
    });
  });
});

describe("Ativação de recorrência em transação existente", () => {
  it("vincula somente a transação do proprietário e não duplica o primeiro lançamento", async () => {
    const tx = {
      transaction: {
        findFirst: jest
          .fn()
          .mockResolvedValue({
            id: "transaction",
            userId: "owner",
            categoryId: "cat",
            type: "EXPENSE",
            amount: 15,
            date: anchor,
          }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      category: { findFirst: jest.fn().mockResolvedValue({ id: "cat" }) },
      recurrence: {
        create: jest
          .fn()
          .mockImplementation(({ data }) => ({ id: "series", ...data })),
      },
    };
    const prisma = { $transaction: jest.fn((fn) => fn(tx)) };
    const result = await new RecurrenceService(prisma as any, {} as any).start(
      "owner",
      { transactionId: "transaction" },
    );
    expect(result.nextDate).toEqual(new Date("2024-02-29T12:30:00Z"));
    expect(tx.transaction.findFirst).toHaveBeenCalledWith({
      where: { id: "transaction", userId: "owner" },
    });
    expect(tx.transaction.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { recurrenceId: "series", recurring: true },
      }),
    );
  });
  it("não permite criar uma segunda série para a mesma transação", async () => {
    const tx = {
      transaction: {
        findFirst: jest.fn().mockResolvedValue({ recurrenceId: "existing" }),
      },
      recurrence: { create: jest.fn() },
    };
    await expect(
      new RecurrenceService(
        { $transaction: (fn: any) => fn(tx) } as any,
        {} as any,
      ).start("owner", { transactionId: "transaction" }),
    ).rejects.toMatchObject({ status: 409 });
    expect(tx.recurrence.create).not.toHaveBeenCalled();
  });
});
