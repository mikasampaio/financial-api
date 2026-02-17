import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { CreateUserDTO } from 'src/modules/users/dtos/user.dtos';

export class AuthLoginDTO {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AuthRegisterDTO extends CreateUserDTO {}
