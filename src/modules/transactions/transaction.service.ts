import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateTransactionDto,
  GetParamsTransactionDto,
  UpdateTransactionDto,
} from "./dtos";
import dayjs from "dayjs";
import { Transaction } from "src/generated/prisma/client";

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async get({
    page,
    limit,
    description,
    categoryId,
    type,
    startDate,
    endDate,
    userId,
  }: GetParamsTransactionDto) {
    const whereParams = {
      userId,
      ...(description && { description: { contains: description } }),
      ...(categoryId && { categoryId }),
      ...(type && { type }),
      ...(startDate && {
        date: {
          gte: new Date(startDate),
        },
      }),
      ...(endDate && {
        date: {
          lte: new Date(endDate),
        },
      }),
    };

    return await this.prisma.transaction.findMany({
      where: whereParams,
      orderBy: {
        date: "desc",
      },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async getById({ id, userId }: { id: string; userId: string }) {
    return await this.prisma.transaction.findUnique({
      where: { id, userId },
    });
  }

  async getByMonth({
    year,
    month,
    userId,
  }: {
    year: number;
    month: number;
    userId: string;
  }) {
    const startDate = dayjs(new Date(year, month - 1, 1))
      .startOf("day")
      .toDate();

    const endDate = dayjs(startDate).endOf("month").startOf("day").toDate();

    const transactions = await this.prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        userId,
      },
      orderBy: {
        date: "desc",
      },
      include: {
        category: {
          select: {
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    const balance = await this.getBalance({ year, month, userId });

    return {
      transactions,
      total: transactions.length,
      month,
      year,
      balance,
    };
  }

  async getBalance({
    year,
    month,
    userId,
  }: {
    year: number;
    month: number;
    userId: string;
  }) {
    const startDate = dayjs(new Date(year, month - 1, 1))
      .startOf("day")
      .toDate();

    const endDate = dayjs(startDate).endOf("month").startOf("day").toDate();

    const transactions: Transaction[] = await this.prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        userId,
      },
    });

    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }

  async create(data: CreateTransactionDto & { userId: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new HttpException("Usuário não encontrado", HttpStatus.NOT_FOUND);
    }

    const category = await this.prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (data.categoryId && !category) {
      throw new HttpException("Categoria não encontrada", HttpStatus.NOT_FOUND);
    }

    if (category?.type !== data.type) {
      throw new HttpException(
        "Tipo da transação deve ser igual ao tipo da categoria",
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.prisma.transaction.create({
      data: {
        ...data,
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        status: {
          createdAt: new Date(),
        },
      },
    });
  }

  async update(id: string, data: UpdateTransactionDto & { userId: string }) {
    if (data.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category)
        throw new HttpException(
          "Categoria não encontrada",
          HttpStatus.NOT_FOUND,
        );

      if (category?.type && data.type && category.type !== data.type) {
        throw new HttpException(
          "Tipo da transação deve ser igual ao tipo da categoria",
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const { amount, date, ...restData } = data;

    return await this.prisma.transaction.update({
      where: { id },
      data: {
        ...restData,
        ...(date && { date: new Date(date) }),
        ...(amount && { amount: parseFloat(amount) }),
        status: {
          updatedAt: new Date(),
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    await this.prisma.transaction.delete({
      where: { id },
    });
  }
}
