import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  MaxLength,
  IsByteLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { CreateUserDTO } from "src/modules/users/dtos/user.dtos";

export class AuthLoginDTO {
  @ApiProperty({
    description: "Email do usuário",
    example: "usuario@exemplo.com",
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Senha do usuário",
    example: "senha123",
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AuthRegisterDTO extends CreateUserDTO {}

export class ForgotPasswordDto {
  @ApiProperty({ example: "usuario@exemplo.com" })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: "Token recebido por email" })
  @Matches(/^[a-f0-9]{64}$/)
  token: string;

  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @IsByteLength(0, 72)
  password: string;
}
