import { PrismaService } from "../../prisma/prisma.service";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

interface JwtPayload {
  version?: string | number;
  sub: string; // ObjectId do MongoDB é string
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET_KEY")!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, authVersion: true },
    });
    if (!user || (payload.version ?? 0) !== (user.authVersion ?? 0))
      throw new UnauthorizedException("Sessão inválida. Faça login novamente.");
    return {
      id: payload.sub,
      email: user.email,
    };
  }
}
