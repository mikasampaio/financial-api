import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";
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
  @IsDateString()
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
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in the format YYYY-MM-DD",
  })
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
