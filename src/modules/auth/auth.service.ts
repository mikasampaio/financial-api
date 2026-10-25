import { publicUser } from "../users/public-user";
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

  async generateToken(
    userId: string,
    email: string,
    version: string | number = 0,
  ) {
    const payload = { sub: userId, email, version };
    return this.jwtService.signAsync(payload);
  }

  async signIn({ email, password }: AuthLoginDTO) {
    const user = await this.userService.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password)))
      throw new HttpException(
        "E-mail ou senha inválidos",
        HttpStatus.UNAUTHORIZED,
      );

    const userData = publicUser(user);

    return {
      ...userData,
      access_token: await this.generateToken(
        user.id,
        user.email,
        user.authVersion ?? 0,
      ),
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
