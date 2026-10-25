import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min, Max } from "class-validator";

export class PeriodFilterDto {
  @ApiPropertyOptional({
    description: "Ano para filtrar as transações",
    example: 2024,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1970)
  @Max(9999)
  year?: number;

  @ApiPropertyOptional({
    description: "Mês para filtrar as transações (1-12)",
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
