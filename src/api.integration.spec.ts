import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import request from "supertest";
import { AppModule } from "./app.module";
import { PrismaService } from "./modules/prisma/prisma.service";
import { MailService } from "./modules/mail/mail.service";

const owner = "507f1f77bcf86cd799439011";
const other = "507f1f77bcf86cd799439012";

describe("Contratos HTTP com persistência simulada", () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    user: {
      findUnique: jest.fn(async (args: any) => {
        const row = {
          id: owner,
          email: "owner@example.com",
          authVersion: 0,
          theme: "dark",
          emailNotifications: false,
          pushNotifications: false,
          password: "never-return-this",
          resetTokenHash: "never-return-this",
        } as Record<string, any>;
        if (args.select)
          return Object.fromEntries(
            Object.keys(args.select).map((key) => [key, row[key]]),
          );
        return Object.fromEntries(
          Object.entries(row).filter(([key]) => !args.omit?.[key]),
        );
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    transaction: {
      findMany: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    category: { findMany: jest.fn().mockResolvedValue([]) },
    recurrence: {
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          JWT_SECRET_KEY: "integration-secret",
          RECURRENCE_WORKER_ENABLED: "false",
        }),
      )
      .overrideProvider(MailService)
      .useValue({ assertConfigured: jest.fn(), sendPasswordReset: jest.fn() })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.listen(0, "127.0.0.1");
    token = new JwtService({ secret: "integration-secret" }).sign({
      sub: owner,
      email: "owner@example.com",
      version: 0,
    });
  });
  afterAll(async () => {
    await app?.close();
  });

  it.each([
    "/dashboard",
    "/recurrences",
    "/reports/spending-ranking",
    "/reports/monthly-comparison",
    "/reports/export",
    "/users/me/preferences",
    "/users/me/export",
    "/categories",
  ])("exige autenticação em %s", async (path) => {
    await request(app.getHttpServer()).get(path).expect(401);
  });
  it("entrega seis meses no dashboard e valida o período", async () => {
    const result = await request(app.getHttpServer())
      .get("/dashboard?year=2026&month=1")
      .auth(token, { type: "bearer" })
      .expect(200);
    expect(result.body.evolution).toHaveLength(6);
    expect(result.body.totalBalance).toBe(0);
    await request(app.getHttpServer())
      .get("/dashboard?month=13")
      .auth(token, { type: "bearer" })
      .expect(400);
  });
  it("restringe perfil alheio", async () => {
    await request(app.getHttpServer())
      .put(`/users/${other}`)
      .auth(token, { type: "bearer" })
      .send({ name: "Other" })
      .expect(403);
  });
  it("não permite sobrescrever userId na consulta de transações", async () => {
    await request(app.getHttpServer())
      .get(`/transactions?userId=${other}`)
      .auth(token, { type: "bearer" })
      .expect(200);
    expect(prisma.transaction.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { userId: owner } }),
    );
  });
  it("expõe preferências antes da rota dinâmica de perfil", async () => {
    const result = await request(app.getHttpServer())
      .get("/users/me/preferences")
      .auth(token, { type: "bearer" })
      .expect(200);
    expect(result.body).toEqual({
      theme: "dark",
      emailNotifications: false,
      pushNotifications: false,
    });
  });
  it("entrega backup sem credenciais nem tokens", async () => {
    const result = await request(app.getHttpServer())
      .get("/users/me/export")
      .auth(token, { type: "bearer" })
      .expect(200)
      .expect("Content-Type", /application\/json/);
    expect(result.headers["content-disposition"]).toContain("attachment");
    expect(result.body.user).not.toHaveProperty("password");
    expect(result.body.user).not.toHaveProperty("resetTokenHash");
    expect(result.body.user).not.toHaveProperty("authVersion");
  });
  it.each([
    ["pdf", "application/pdf"],
    [
      "xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  ])("entrega arquivo %s com headers de download", async (format, type) => {
    const result = await request(app.getHttpServer())
      .get(`/reports/export?year=2026&month=1&format=${format}`)
      .auth(token, { type: "bearer" })
      .expect(200)
      .expect("Content-Type", type);
    expect(result.headers["content-disposition"]).toContain(
      `relatorio-2026-01.${format}`,
    );
  });
  it("documenta os novos endpoints no Swagger", () => {
    const docs = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    expect(docs.paths).toHaveProperty("/auth/forgot-password");
    expect(docs.paths).toHaveProperty("/dashboard");
    expect(docs.paths).toHaveProperty("/reports/export");
    expect(docs.paths).toHaveProperty("/recurrences");
  });
});
