import { randomBytes } from "node:crypto";
import { publicUserOmit, PublicUser } from "./public-user";
import { UpdatePreferencesDto, ChangePasswordDto } from "./dtos/user.dtos";
import {
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import * as bcrypt from "bcrypt";
import { CreateUserDTO, UpdateUserDTO } from "./dtos/user.dtos";
import { PrismaService } from "../prisma/prisma.service";
import { User } from "src/generated/prisma/client";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(userId: string): Promise<PublicUser[]> {
    return await this.prisma.user.findMany({
      where: { id: userId },
      omit: publicUserOmit,
    });
  }

  async getById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
      omit: publicUserOmit,
    });
  }

  async createUser(data: CreateUserDTO): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (user)
      throw new HttpException("E-mail já está em uso", HttpStatus.BAD_REQUEST);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    data.password = hashedPassword;

    return this.prisma.user.create({
      omit: publicUserOmit,
      data: {
        ...data,
        status: {
          createdAt: new Date(),
        },
      },
    });
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<PublicUser> {
    if (!(await this.getById(id)))
      throw new NotFoundException("Usuário não encontrado");

    const { currentPassword, ...profile } = data;
    if (profile.email) {
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
      if (
        !currentPassword ||
        !(await bcrypt.compare(currentPassword, user.password))
      )
        throw new UnauthorizedException("Senha atual inválida");
    }

    return await this.prisma.user.update({
      omit: publicUserOmit,
      where: { id },
      data: {
        ...profile,
        ...(profile.email && {
          resetTokenHash: null,
          resetTokenExpiresAt: null,
          authVersion: randomBytes(16).toString("hex"),
        }),
        status: {
          updatedAt: new Date(),
        },
      },
    });
  }

  async preferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        theme: true,
        emailNotifications: true,
        pushNotifications: true,
      },
    });
    if (!user) throw new NotFoundException("Usuário não encontrado");
    return {
      theme: user.theme ?? "system",
      emailNotifications: user.emailNotifications ?? false,
      pushNotifications: user.pushNotifications ?? false,
    };
  }

  async updatePreferences(userId: string, data: UpdatePreferencesDto) {
    await this.prisma.user.update({ where: { id: userId }, data });
    return this.preferences(userId);
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(data.currentPassword, user.password)))
      throw new UnauthorizedException("Senha atual inválida");
    const result = await this.prisma.user.updateMany({
      where: { id: userId, password: user.password },
      data: {
        password: await bcrypt.hash(data.password, 10),
        authVersion: randomBytes(16).toString("hex"),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });
    if (!result.count)
      throw new UnauthorizedException(
        "Senha alterada durante a solicitação. Faça login novamente.",
      );
    return { message: "Senha alterada. Faça login novamente." };
  }

  async revokeSessions(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { authVersion: randomBytes(16).toString("hex") },
      select: { id: true },
    });
    return { message: "Sessões encerradas." };
  }

  async exportData(userId: string) {
    const [user, categories, transactions, recurrences] = await Promise.all([
      this.getById(userId),
      this.prisma.category.findMany({
        where: {
          OR: [{ userId }, { userId: null }, { userId: { isSet: false } }],
        },
      }),
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: "asc" },
      }),
      this.prisma.recurrence.findMany({ where: { userId } }),
    ]);
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      user,
      categories,
      transactions,
      recurrences,
    };
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.getById(id);

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    await this.prisma.user.delete({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email } });
  }
}
