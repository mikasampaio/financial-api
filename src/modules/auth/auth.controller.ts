import { PasswordRecoveryService } from "./password-recovery.service";
import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  AuthLoginDTO,
  AuthRegisterDTO,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./dtos";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly recovery: PasswordRecoveryService,
  ) {}

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Solicitar redefinição de senha por email" })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.recovery.request(body.email);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Redefinir senha com token de uso único" })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.recovery.reset(body.token, body.password);
  }

  @Post("register")
  @ApiOperation({ summary: "Registrar novo usuário" })
  @ApiResponse({ status: 201, description: "Usuário criado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  @ApiResponse({ status: 409, description: "Email já cadastrado" })
  async register(@Body() body: AuthRegisterDTO) {
    return this.authService.register(body);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Fazer login" })
  @ApiResponse({ status: 200, description: "Login realizado com sucesso" })
  @ApiResponse({ status: 401, description: "Credenciais inválidas" })
  async login(@Body() body: AuthLoginDTO) {
    return this.authService.signIn(body);
  }
}
