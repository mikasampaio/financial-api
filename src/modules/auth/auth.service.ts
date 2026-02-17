import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UserService } from "../users/user.services";
import { AuthLoginDTO, AuthRegisterDTO } from "./dtos";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async generateToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    return this.jwtService.signAsync(payload);
  }

  async signIn({ email, password }: AuthLoginDTO) {
    const user = await this.userService.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password)))
      throw new HttpException(
        "E-mail ou senha inválidos",
        HttpStatus.UNAUTHORIZED,
      );

    const { password: _, ...userData } = user;

    return {
      ...userData,
      access_token: await this.generateToken(user.id, user.email),
    };
  }

  async register(data: AuthRegisterDTO) {
    const user = await this.userService.createUser(data);

    return {
      ...user,
      access_token: await this.generateToken(user.id, user.email),
    };
  }
}
