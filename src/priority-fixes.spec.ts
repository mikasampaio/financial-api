import { ForbiddenException, ValidationPipe } from "@nestjs/common";
import { UserOwnerGuard } from "./common/guards/user-owner.guard";
import { calculatePeriodDates } from "./common/helpers/calculate-period-dates.helper";
import { TransactionController } from "./modules/transactions/transaction.controller";
import { TransactionService } from "./modules/transactions/transaction.service";
import { CategoryService } from "./modules/categories/category.service";
import { ReportService } from "./modules/reports/report.service";
import { UserService } from "./modules/users/user.services";
import { CreateUserDTO } from "./modules/users/dtos/user.dtos";
import { AuthService } from "./modules/auth/auth.service";

const owner = "507f1f77bcf86cd799439011";
const other = "507f1f77bcf86cd799439012";

describe("Correções prioritárias", () => {
  it("impede sobrescrever o usuário autenticado pela query", () => {
    const service = { get: jest.fn() };
    new TransactionController(service as any).get(owner, {
      userId: other,
    } as any);
    expect(service.get).toHaveBeenCalledWith(
      expect.objectContaining({ userId: owner }),
    );
  });

  it("restringe o perfil ao proprietário", () => {
    const guard = new UserOwnerGuard();
    const context = (id: string) =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: owner }, params: { id } }),
        }),
      }) as any;
    expect(guard.canActivate(context(owner))).toBe(true);
    expect(() => guard.canActivate(context(other))).toThrow(ForbiddenException);
  });

  it.each(["update", "delete"])(
    "bloqueia %s de transação alheia antes de gravar",
    async (method) => {
      const prisma = {
        transaction: {
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
          delete: jest.fn(),
        },
      };
      const service = new TransactionService(prisma as any);
      const result =
        method === "update"
          ? service.update("transaction", { userId: owner })
          : service.delete("transaction", owner);
      await expect(result).rejects.toMatchObject({ status: 404 });
      expect(prisma.transaction.update).not.toHaveBeenCalled();
      expect(prisma.transaction.delete).not.toHaveBeenCalled();
    },
  );

  it("mantém a propriedade na atualização da transação", async () => {
    const prisma = {
      transaction: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ type: "INCOME", categoryId: null }),
        update: jest.fn(),
      },
    };
    await new TransactionService(prisma as any).update("transaction", {
      userId: owner,
      description: "teste",
    });
    const args = prisma.transaction.update.mock.calls[0][0];
    expect(args.where).toEqual({ id: "transaction", userId: owner });
    expect(args.data).not.toHaveProperty("userId");
  });

  it.each(["update", "delete"])(
    "protege categorias padrão e alheias contra %s",
    async (method) => {
      const prisma = {
        category: {
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
          delete: jest.fn(),
        },
      };
      const service = new CategoryService(prisma as any);
      await expect(
        method === "update"
          ? service.update("category", {}, owner)
          : service.delete("category", owner),
      ).rejects.toMatchObject({ status: 404 });
      expect(prisma.category.update).not.toHaveBeenCalled();
      expect(prisma.category.delete).not.toHaveBeenCalled();
    },
  );

  it("lista categorias próprias e padrão, incluindo documentos antigos sem userId", async () => {
    const prisma = { category: { findMany: jest.fn() } };
    await new CategoryService(prisma as any).get({} as any, owner);
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { userId: owner },
            { userId: null },
            { userId: { isSet: false } },
          ],
        }),
      }),
    );
  });

  it("inclui todo o último dia de fevereiro bissexto", () => {
    const { startDate, endDate } = calculatePeriodDates(2024, 2);
    expect(startDate.getUTCDate()).toBe(1);
    expect(endDate.getUTCDate()).toBe(29);
    expect(endDate.getUTCHours()).toBe(23);
    expect(endDate.getMilliseconds()).toBe(999);
  });

  it("soma grupos em dias diferentes sem misturar meses e anos", async () => {
    const prisma = {
      transaction: {
        groupBy: jest.fn().mockResolvedValue([
          {
            date: new Date(2026, 1, 20),
            type: "EXPENSE",
            _sum: { amount: 20 },
          },
          {
            date: new Date(2026, 1, 10),
            type: "EXPENSE",
            _sum: { amount: 30 },
          },
          {
            date: new Date(2026, 1, 10),
            type: "INCOME",
            _sum: { amount: 100 },
          },
          { date: new Date(2026, 1, 1), type: "INCOME", _sum: { amount: 200 } },
          { date: new Date(2025, 1, 1), type: "INCOME", _sum: { amount: 10 } },
        ]),
      },
    };
    const result = await new ReportService(
      prisma as any,
    ).getIncomesAndExpensesMonthly({ userId: owner });
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ year: 2026, expense: 50, income: 300 });
    expect(result[1]).toMatchObject({ year: 2025, income: 10 });
  });

  it("remove campos extras antes de criar um perfil e omite a senha na resposta", async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const input = await pipe.transform(
      {
        name: "Teste",
        email: "test@example.com",
        password: "secret123",
        id: other,
      },
      { type: "body", metatype: CreateUserDTO },
    );
    expect(input).not.toHaveProperty("id");
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: owner, email: input.email }),
      },
    };
    const service = new UserService(prisma as any);
    const response = await new AuthService(service, {
      signAsync: jest.fn().mockResolvedValue("token"),
    } as any).register(input);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        omit: expect.objectContaining({
          password: true,
          resetTokenHash: true,
          authVersion: true,
        }),
      }),
    );
    expect(response).not.toHaveProperty("password");
    expect(response.access_token).toBe("token");
  });

  it("omite a senha na atualização do perfil e restringe a listagem", async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: owner }),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };
    const service = new UserService(prisma as any);
    await service.updateUser(owner, { name: "Novo nome" });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        omit: expect.objectContaining({
          password: true,
          resetTokenHash: true,
          authVersion: true,
        }),
      }),
    );
    await service.getUsers(owner);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: owner },
      omit: expect.objectContaining({
        password: true,
        resetTokenHash: true,
        authVersion: true,
      }),
    });
  });
});
