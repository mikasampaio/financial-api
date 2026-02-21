import { IsEmail, IsNotEmpty, IsString } from "class-validator";
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
