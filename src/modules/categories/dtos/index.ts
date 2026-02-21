import {
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

export class GetParamsCategoryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: "ID da categoria",
    example: "507f1f77bcf86cd799439011",
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: "Nome da categoria",
    example: "Alimentação",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: "Tipo da categoria",
    enum: ["INCOME", "EXPENSE"],
    example: "EXPENSE",
  })
  @IsOptional()
  @IsEnum(["INCOME", "EXPENSE"])
  type?: "INCOME" | "EXPENSE";
}

export class CreateCategoryDto {
  @ApiProperty({
    description: "Nome da categoria",
    example: "Alimentação",
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: "Descrição da categoria",
    example: "Gastos com alimentação e restaurantes",
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    description: "Tipo da categoria",
    enum: ["INCOME", "EXPENSE"],
    example: "EXPENSE",
  })
  @IsEnum(["INCOME", "EXPENSE"])
  type: "INCOME" | "EXPENSE";

  @ApiProperty({
    description: "Cor em formato hexadecimal",
    example: "#FF5733",
  })
  @IsHexColor()
  color: string;

  @ApiProperty({
    description: "Nome do ícone do lucide-react (PascalCase)",
    example: "ShoppingCart",
  })
  @IsString()
  @Matches(/^[A-Z][a-zA-Z0-9]*$/, {
    message: "Icon must be a valid lucide-react icon name (PascalCase)",
  })
  icon: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
