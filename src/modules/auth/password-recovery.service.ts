import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";

@Injectable()
export class PasswordRecoveryService {
  private readonly logger = new Logger(PasswordRecoveryService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async request(email: string) {
    this.mail.assertConfigured();
    const message = {
      message:
        "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.",
    };
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return message;
    const now = new Date();
    const token = randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");
    const updated = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        OR: [
          { resetRequestedAt: { lte: new Date(now.getTime() - 60000) } },
          { resetRequestedAt: null },
          { resetRequestedAt: { isSet: false } },
        ],
      },
      data: {
        resetTokenHash: hash,
        resetTokenExpiresAt: new Date(now.getTime() + 30 * 60000),
        resetRequestedAt: now,
      },
    });
    if (!updated.count) return message;
    try {
      await this.mail.sendPasswordReset(email, token);
    } catch {
      await this.prisma.user.updateMany({
        where: { id: user.id, resetTokenHash: hash },
        data: { resetTokenHash: null, resetTokenExpiresAt: null },
      });
      this.logger.error("Falha na entrega do email de recuperação de senha");
    }
    return message;
  }

  async reset(token: string, password: string) {
    const hash = createHash("sha256").update(token).digest("hex");
    // Consumo e troca de senha são uma única operação atômica, inclusive em requisições concorrentes.
    const result = await this.prisma.user.updateMany({
      where: { resetTokenHash: hash, resetTokenExpiresAt: { gt: new Date() } },
      data: {
        password: await bcrypt.hash(password, 10),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        authVersion: randomBytes(16).toString("hex"),
      },
    });
    if (!result.count)
      throw new BadRequestException("Token inválido ou expirado");
    return { message: "Senha redefinida. Faça login novamente." };
  }
}
