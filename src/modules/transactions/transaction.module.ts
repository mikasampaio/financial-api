import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { PrismaModule } from "../prisma/prisma.module";
import { TransactionController } from "./transaction.controller";
import { LoggerMiddleware } from "src/common/middlewares/userId.middleware";

@Module({
  imports: [PrismaModule],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(TransactionController);
  }
}
