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
import { PaginationDto } from "src/common/dtos/pagination.dto";
import { PartialType, IntersectionType } from "@nestjs/swagger";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PeriodFilterDto } from "src/common/dtos/period.dto";

// Classes base reutilizáveis
export class TransactionTypeFilterDto {
  @ApiPropertyOptional({
    description: "Tipo da transação",
    enum: ["INCOME", "EXPENSE"],
    example: "EXPENSE",
  })
  @IsOptional()
  @IsEnum(["INCOME", "EXPENSE"])
  type?: "INCOME" | "EXPENSE";
}

export class CategoryFilterDto {
  @ApiPropertyOptional({
    description: "ID da categoria",
    example: "507f1f77bcf86cd799439011",
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class DateRangeFilterDto {
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

export class DescriptionFilterDto {
  @ApiPropertyOptional({
    description: "Descrição da transação",
    example: "Compra no supermercado",
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UserIdFilterDto {
  @ApiPropertyOptional({
    description: "ID do usuário",
    example: "507f1f77bcf86cd799439012",
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

class GetParamsTransactionDtoBase extends PaginationDto {}
export class GetParamsTransactionDto extends IntersectionType(
  GetParamsTransactionDtoBase,
  DescriptionFilterDto,
  CategoryFilterDto,
  UserIdFilterDto,
  TransactionTypeFilterDto,
  DateRangeFilterDto,
) {}

export class GetBalanceQueryDto extends PeriodFilterDto {}

export class SearchFilterDto {
  @ApiPropertyOptional({
    description: "Campo de busca para descrição ou categoria da transação",
    example: "supermercado",
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CategoryIdsFilterDto {
  @ApiPropertyOptional({
    description: "ID's das categorias separados por vírgula",
    example: "507f1f77bcf86cd799439011,507f1f77bcf86cd799439012",
  })
  @IsOptional()
  @IsString()
  categoryIds?: string;
}

export class GetTransactionByMonthDto extends IntersectionType(
  PeriodFilterDto,
  SearchFilterDto,
  CategoryIdsFilterDto,
  TransactionTypeFilterDto,
) {}

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
