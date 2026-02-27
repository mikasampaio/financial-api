import { Module } from "@nestjs/common";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { CategoryModule } from "./modules/categories/category.module";
import { TransactionModule } from "./modules/transactions/transaction.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/users/user.module";
import { ConfigModule } from "@nestjs/config";
import { ReportModule } from "./modules/reports/report.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CategoryModule,
    TransactionModule,
    UserModule,
    AuthModule,
    ReportModule,
  ],
})
export class AppModule {}
