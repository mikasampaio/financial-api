import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport } from "nodemailer";

@Injectable()
export class MailService {
  constructor(private readonly config: ConfigService) {}

  assertConfigured() {
    if (
      !this.config.get("SMTP_HOST") ||
      !this.config.get("MAIL_FROM") ||
      !this.config.get("PASSWORD_RESET_URL")
    ) {
      throw new ServiceUnavailableException(
        "Recuperação de senha indisponível: configure SMTP e PASSWORD_RESET_URL",
      );
    }
    try {
      const url = new URL(this.config.getOrThrow<string>("PASSWORD_RESET_URL"));
      if (!["http:", "https:"].includes(url.protocol))
        throw new Error("Invalid protocol");
    } catch {
      throw new ServiceUnavailableException("PASSWORD_RESET_URL inválida");
    }
  }

  async sendPasswordReset(email: string, token: string) {
    this.assertConfigured();
    const url = new URL(this.config.getOrThrow<string>("PASSWORD_RESET_URL"));
    url.searchParams.set("token", token);
    const user = this.config.get<string>("SMTP_USER");
    const transport = createTransport({
      host: this.config.getOrThrow<string>("SMTP_HOST"),
      port: Number(this.config.get("SMTP_PORT") ?? 587),
      secure: this.config.get("SMTP_SECURE") === "true",
      auth: user
        ? { user, pass: this.config.getOrThrow<string>("SMTP_PASSWORD") }
        : undefined,
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });
    try {
      await transport.sendMail({
        from: this.config.getOrThrow<string>("MAIL_FROM"),
        to: email,
        subject: "Redefinição de senha — Controle financeiro",
        text: `Para redefinir sua senha, acesse: ${url.toString()}\nO link expira em 30 minutos. Se você não solicitou, ignore este email.`,
      });
    } finally {
      transport.close();
    }
  }
}
