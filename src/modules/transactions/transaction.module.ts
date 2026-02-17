import { Module } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { PrismaModule } from "../prisma/prisma.module";
import { TransactionController } from "./transaction.controller";

@Module({
  imports: [PrismaModule],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
