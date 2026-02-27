import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";

export class PeriodFilterDto {
  @ApiPropertyOptional({
    description: "Ano para filtrar as transações",
    example: 2024,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({
    description: "Mês para filtrar as transações (1-12)",
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  month?: number;
}
