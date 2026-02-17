import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthLoginDTO, AuthRegisterDTO } from "./dtos";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() body: AuthRegisterDTO) {
    return this.authService.register(body);
  }

  @Post("login")
  async login(@Body() body: AuthLoginDTO) {
    return this.authService.signIn(body);
  }
}
