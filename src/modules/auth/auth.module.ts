import { Module } from "@nestjs/common";
import { UserModule } from "../users/user.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategies";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
  imports: [
    ConfigModule,
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET_KEY"),
        signOptions: { expiresIn: "1d" },
      }),
    }),
  ],
})
export class AuthModule {}
