import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "src/generated/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();
  }

  async onModuleInit() {
	console.log("Conectando ao banco de dados...");
    await this.$connect();
	console.log("Conectado ao banco de dados");
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
