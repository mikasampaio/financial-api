import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";
import { PaginationDto } from "src/common/query/pagination.query";
import { PartialType } from "@nestjs/swagger";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class GetParamsTransactionDto extends PaginationDto {
  @ApiPropertyOptional({
    description: "Descrição da transação",
    example: "Compra no supermercado",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "ID da categoria",
    example: "507f1f77bcf86cd799439011",
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: "ID do usuário",
    example: "507f1f77bcf86cd799439012",
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: "Tipo da transação",
    enum: ["INCOME", "EXPENSE"],
    example: "EXPENSE",
  })
  @IsOptional()
  @IsEnum(["INCOME", "EXPENSE"])
  type?: "INCOME" | "EXPENSE";

  @ApiPropertyOptional({
    description: "Data de início do filtro",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "Data de fim do filtro",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class GetBalanceQueryDto {
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

export class GetTransactionByMonthDto {
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

  @ApiPropertyOptional({
    description: "Campo de busca para descrição ou categoria da transação",
    example: "supermercado",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "ID's das categorias separados por vírgula",
    example: "507f1f77bcf86cd799439011,507f1f77bcf86cd799439012",
  })
  @IsOptional()
  @IsString()
  categoryIds?: string;

  @ApiPropertyOptional({
    description: "Tipo da transação",
    enum: ["INCOME", "EXPENSE"],
    example: "EXPENSE",
  })
  @IsOptional()
  @IsEnum(["INCOME", "EXPENSE"])
  type?: "INCOME" | "EXPENSE";
}

export class CreateTransactionDto {
  @ApiProperty({
    description: "Tipo da transação",
    enum: ["INCOME", "EXPENSE"],
    example: "EXPENSE",
  })
  @IsNotEmpty()
  @IsEnum(["INCOME", "EXPENSE"])
  type: "INCOME" | "EXPENSE";

  @ApiProperty({
    description: "Valor da transação",
    example: "150.50",
  })
  @IsNotEmpty()
  @IsString()
  amount: string;

  @ApiProperty({
    description: "Data da transação no formato YYYY-MM-DD",
    example: "2024-02-18",
  })
  @IsNotEmpty()
  // @Matches(/^\d{4}-\d{2}-\d{2}$/, {
  //   message: "Date must be in the format YYYY-MM-DD",
  // })
  date: string;

  @ApiPropertyOptional({
    description: "Se a transação é recorrente",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  recurring?: boolean;

  @ApiPropertyOptional({
    description: "Descrição da transação",
    example: "Compra no supermercado",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: "ID da categoria",
    example: "507f1f77bcf86cd799439011",
  })
  @IsNotEmpty()
  @IsString()
  categoryId: string;
}

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}
