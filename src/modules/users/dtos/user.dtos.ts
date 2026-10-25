import { PartialType, OmitType } from "@nestjs/swagger";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  MinLength,
  MaxLength,
  ValidateIf,
  IsByteLength,
} from "class-validator";

export class CreateUserDTO {
  @ApiProperty({
    description: "Nome completo do usuário",
    example: "João Silva",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Email do usuário",
    example: "joao.silva@exemplo.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "Senha do usuário",
    example: "senha123",
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @IsByteLength(0, 72)
  password: string;
}

export class UpdateUserDTO extends PartialType(
  OmitType(CreateUserDTO, ["password"] as const),
) {
  @ApiPropertyOptional({ description: "Obrigatória para alterar o email" })
  @IsOptional()
  @IsString()
  currentPassword?: string;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ enum: ["light", "dark", "system"] })
  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(["light", "dark", "system"])
  theme?: string;

  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  pushNotifications?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @IsByteLength(0, 72)
  password: string;
}
