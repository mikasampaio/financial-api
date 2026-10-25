import { TransactionService } from "./transaction.service";
import { CreateTransactionDto } from "./dtos";
import { ValidationPipe } from "@nestjs/common";

const input = {
  userId: "owner",
  type: "EXPENSE" as const,
  categoryId: "507f1f77bcf86cd799439011",
  amount: "10.50",
  date: "2026-01-31",
  recurring: true,
};
function fixture() {
  const tx = {
    recurrence: { create: jest.fn().mockResolvedValue({ id: "series" }) },
    transaction: { create: jest.fn().mockImplementation(({ data }) => data) },
  };
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue({ id: "owner" }) },
    category: { findFirst: jest.fn().mockResolvedValue({ type: "EXPENSE" }) },
    $transaction: jest.fn((fn) => fn(tx)),
  };
  return { service: new TransactionService(prisma as any), prisma, tx };
}
describe("Criação de transações recorrentes", () => {
  it("cria primeiro lançamento e série na mesma transação com frequência mensal padrão", async () => {
    const { service, prisma, tx } = fixture();
    const result = await service.create(input);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.recurrence.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          frequency: "MONTHLY",
          nextDate: new Date("2026-02-28T00:00:00Z"),
        }),
      }),
    );
    expect(result).toMatchObject({
      recurrenceId: "series",
      userId: "owner",
      amount: 10.5,
    });
    expect(result).not.toHaveProperty("frequency");
    expect(result).not.toHaveProperty("recurrenceEndsAt");
  });
  it("rejeita data final anterior ao primeiro lançamento", async () => {
    const { service, prisma } = fixture();
    await expect(
      service.create({ ...input, recurrenceEndsAt: "2026-01-01" }),
    ).rejects.toMatchObject({ status: 400 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it("rejeita configuração de série sem recorrência ativada", async () => {
    const { service } = fixture();
    await expect(
      service.create({ ...input, recurring: false, frequency: "DAILY" }),
    ).rejects.toMatchObject({ status: 400 });
  });
  it.each(["abc", "10x", "-1", "1.234"])(
    "rejeita valor inválido %s no DTO",
    async (amount) => {
      await expect(
        new ValidationPipe({ transform: true }).transform(
          { ...input, amount },
          { type: "body", metatype: CreateTransactionDto },
        ),
      ).rejects.toMatchObject({ status: 400 });
    },
  );
  it("valida categoria e tipo antes de criar uma série", async () => {
    const { service, prisma } = fixture();
    prisma.category.findFirst.mockResolvedValue(null as any);
    await expect(service.create(input)).rejects.toMatchObject({ status: 404 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
