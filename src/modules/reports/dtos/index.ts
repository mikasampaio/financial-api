import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional } from "class-validator";
import { PeriodFilterDto } from "src/common/dtos/period.dto";

export class GetExpenseByCategoryQueryDto extends PeriodFilterDto {}
export class GetIncomesAndExpensesQueryDto extends PeriodFilterDto {}
export class ExportReportDto extends PeriodFilterDto {
  @ApiPropertyOptional({ enum: ["pdf", "xlsx"], default: "pdf" })
  @IsOptional()
  @IsIn(["pdf", "xlsx"])
  format?: "pdf" | "xlsx";
}
