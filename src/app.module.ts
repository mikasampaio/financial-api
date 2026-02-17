import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { CategoryModule } from "./modules/categories/category.module";

@Module({
  imports: [PrismaModule, CategoryModule],
})
export class AppModule {}
