import { Module } from "@nestjs/common";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { CategoryModule } from "./modules/categories/category.module";
import { TransactionModule } from "./modules/transactions/transaction.module";

@Module({
  imports: [PrismaModule, CategoryModule, TransactionModule],
})
export class AppModule {}
