import { UserService } from "./user.services";
import * as bcrypt from "bcrypt";
import { ValidationPipe } from "@nestjs/common";
import { UpdatePreferencesDto, UpdateUserDTO } from "./dtos/user.dtos";

describe("Preferências, segurança e backup do perfil", () => {
  it("usa valores padrão para usuários anteriores às preferências", async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          theme: null,
          emailNotifications: null,
          pushNotifications: null,
        }),
      },
    };
    expect(await new UserService(prisma as any).preferences("owner")).toEqual({
      theme: "system",
      emailNotifications: false,
      pushNotifications: false,
    });
  });
  it("aceita false nas preferências e rejeita tema desconhecido", async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    expect(
      await pipe.transform(
        { theme: "dark", emailNotifications: false, id: "other" },
        { type: "body", metatype: UpdatePreferencesDto },
      ),
    ).toEqual({ theme: "dark", emailNotifications: false });
    await expect(
      pipe.transform(
        { theme: "unknown" },
        { type: "body", metatype: UpdatePreferencesDto },
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("impede troca de senha pelo endpoint de edição simples do perfil", async () => {
    const data = await new ValidationPipe({ whitelist: true }).transform(
      { name: "Teste", password: "hacked" },
      { type: "body", metatype: UpdateUserDTO },
    );
    expect(data).not.toHaveProperty("password");
  });
  it("exige a senha atual para alterar email", async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: "owner" }),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ password: await bcrypt.hash("secret", 4) }),
        update: jest.fn(),
      },
    };
    await expect(
      new UserService(prisma as any).updateUser("owner", {
        email: "other@example.com",
      }),
    ).rejects.toMatchObject({ status: 401 });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it("rejeita senha atual incorreta sem modificar o perfil", async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          password: await bcrypt.hash("old-password", 4),
        }),
        updateMany: jest.fn(),
      },
    };
    await expect(
      new UserService(prisma as any).changePassword("owner", {
        currentPassword: "wrong",
        password: "new-password",
      }),
    ).rejects.toMatchObject({ status: 401 });
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
  it("troca senha com verificação concorrente e revoga sessões", async () => {
    const oldHash = await bcrypt.hash("old-password", 4);
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ password: oldHash }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    await new UserService(prisma as any).changePassword("owner", {
      currentPassword: "old-password",
      password: "new-password",
    });
    const args = prisma.user.updateMany.mock.calls[0][0];
    expect(args.where).toEqual({ id: "owner", password: oldHash });
    expect(await bcrypt.compare("new-password", args.data.password)).toBe(true);
    expect(args.data).toMatchObject({
      authVersion: expect.any(String),
      resetTokenHash: null,
    });
  });
  it("limita cada conjunto do backup ao usuário e omite segredos", async () => {
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: "owner", email: "email" }),
      },
      category: { findMany: jest.fn().mockResolvedValue([]) },
      transaction: { findMany: jest.fn().mockResolvedValue([]) },
      recurrence: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const result = await new UserService(prisma as any).exportData("owner");
    expect(result.version).toBe(1);
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "owner" } }),
    );
    expect(prisma.recurrence.findMany).toHaveBeenCalledWith({
      where: { userId: "owner" },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        omit: expect.objectContaining({
          password: true,
          resetTokenHash: true,
          authVersion: true,
        }),
      }),
    );
  });
});
