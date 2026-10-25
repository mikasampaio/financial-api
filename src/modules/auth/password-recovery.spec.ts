import { createHash } from "node:crypto";
import * as bcrypt from "bcrypt";
import { PasswordRecoveryService } from "./password-recovery.service";
import { JwtStrategy } from "./strategies/jwt.strategies";
import { ConfigService } from "@nestjs/config";
import { publicUser } from "../users/public-user";

function fixture() {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: "user" }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const mail = {
    assertConfigured: jest.fn(),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  };
  const service = new PasswordRecoveryService(prisma as any, mail as any);
  return { prisma, mail, service };
}
describe("Recuperação de senha e sessões", () => {
  it("envia token aleatório, armazena só o hash e não o retorna ao cliente", async () => {
    const { service, prisma, mail } = fixture();
    const result = await service.request("test@example.com");
    const token = mail.sendPasswordReset.mock.calls[0][1];
    expect(token).toMatch(/^[a-f\d]{64}$/);
    expect(JSON.stringify(result)).not.toContain(token);
    const saved = prisma.user.updateMany.mock.calls[0][0].data;
    expect(saved.resetTokenHash).toBe(
      createHash("sha256").update(token).digest("hex"),
    );
    expect(
      saved.resetTokenExpiresAt.getTime() - saved.resetRequestedAt.getTime(),
    ).toBe(30 * 60000);
  });
  it("retorna a mesma resposta para email inexistente sem enviar email", async () => {
    const a = fixture();
    const b = fixture();
    b.prisma.user.findUnique.mockResolvedValue(null as any);
    expect(await a.service.request("known@example.com")).toEqual(
      await b.service.request("missing@example.com"),
    );
    expect(b.mail.sendPasswordReset).not.toHaveBeenCalled();
  });
  it("aplica intervalo mínimo entre solicitações", async () => {
    const { service, prisma, mail } = fixture();
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    await service.request("test@example.com");
    expect(mail.sendPasswordReset).not.toHaveBeenCalled();
  });
  it("troca a senha e consome o token numa única operação, invalidando sessões", async () => {
    const { service, prisma } = fixture();
    await service.reset("a".repeat(64), "new-password");
    const args = prisma.user.updateMany.mock.calls[0][0];
    expect(args.where.resetTokenExpiresAt.gt).toBeInstanceOf(Date);
    expect(await bcrypt.compare("new-password", args.data.password)).toBe(true);
    expect(args.data).toMatchObject({
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      authVersion: expect.any(String),
    });
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.reset("a".repeat(64), "new-password"),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("rejeita tokens expirados ou inexistentes", async () => {
    const { service, prisma } = fixture();
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.reset("b".repeat(64), "new-password"),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("remove todos os segredos do objeto público", () => {
    expect(
      publicUser({
        id: "user",
        email: "email",
        password: "hash",
        authVersion: 2,
        resetTokenHash: "secret",
        resetTokenExpiresAt: new Date(),
        resetRequestedAt: new Date(),
      } as any),
    ).toEqual({ id: "user", email: "email" });
  });
  it("rejeita JWT antigo após redefinição e aceita a versão atual", async () => {
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: "user", email: "email", authVersion: 1 }),
      },
    };
    const strategy = new JwtStrategy(
      new ConfigService({ JWT_SECRET_KEY: "test-secret" }),
      prisma as any,
    );
    await expect(
      strategy.validate({ sub: "user", email: "email" }),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      strategy.validate({ sub: "user", email: "email", version: 1 }),
    ).resolves.toEqual({ id: "user", email: "email" });
    prisma.user.findUnique.mockResolvedValue(null as any);
    await expect(
      strategy.validate({ sub: "user", email: "email", version: 1 }),
    ).rejects.toMatchObject({ status: 401 });
  });
});
