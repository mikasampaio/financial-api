import { ReportExportService } from "./report-export.service";
import { Module } from "@nestjs/common";
import { ReportController } from "./report.controller";
import { ReportService } from "./report.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  controllers: [ReportController],
  providers: [ReportService, ReportExportService],
  exports: [ReportService],
  imports: [PrismaModule],
})
export class ReportModule {}
