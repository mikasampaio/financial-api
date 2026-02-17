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
import { PartialType } from "@nestjs/mapped-types";

export class GetParamsCategoryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(["INCOME", "EXPENSE"])
  type?: "INCOME" | "EXPENSE";
}

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsEnum(["INCOME", "EXPENSE"])
  type: "INCOME" | "EXPENSE";

  @IsHexColor()
  color: string;

  @IsString()
  @Matches(/^[A-Z][a-zA-Z0-9]*$/, {
    message: "Icon must be a valid lucide-react icon name (PascalCase)",
  })
  icon: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
