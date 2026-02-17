import {
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

  async getUsers(): Promise<Omit<User, "password">[]> {
    return await this.prisma.user.findMany({
      omit: { password: true },
    });
  }

  async getById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (user)
      throw new HttpException("E-mail já está em uso", HttpStatus.BAD_REQUEST);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    data.password = hashedPassword;

    return this.prisma.user.create({
      data: {
        ...data,
        status: {
          createdAt: new Date(),
        },
      },
    });
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    await this.getById(id);

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      data.password = hashedPassword;
    }

    return await this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        status: {
          updatedAt: new Date(),
        },
      },
    });
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
