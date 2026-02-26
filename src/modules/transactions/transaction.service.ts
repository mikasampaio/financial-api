import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateTransactionDto,
  GetParamsTransactionDto,
  GetTransactionByMonthDto,
  UpdateTransactionDto,
} from "./dtos";
import dayjs from "dayjs";
import { Transaction } from "src/generated/prisma/client";
import { months } from "src/common/utils/months.util";
import {
  buildTransactionWhereClause,
  calculateBalance,
  calculatePeriodDates,
  categoryInclude,
} from "./helpers/transaction.helpers";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  /* Lista todas as transações */
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
    const whereParams = buildTransactionWhereClause({
      userId,
      description,
      categoryId,
      type,
      startDate,
      endDate,
    });

    return await this.prisma.transaction.findMany({
      where: whereParams,
      orderBy: {
        date: "desc",
      },
      include: categoryInclude,
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  /* Obtém uma transação pelo ID */
  async getById({ id, userId }: { id: string; userId: string }) {
    return await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: categoryInclude,
    });
  }

  /* Obtém todas as transações agrupadas por período */
  async getGroupedByDate({
    year,
    month,
    userId,
    search,
    categoryIds,
    type,
  }: GetTransactionByMonthDto & { userId: string }) {
    // Aplicar valores padrão se não fornecidos
    const yearFormat = year ?? dayjs().year();
    const monthFormat = month ?? dayjs().month() + 1;

    const whereParams = buildTransactionWhereClause({
      userId,
      year: yearFormat,
      month: monthFormat,
      search,
      categoryIds,
      type,
    });

    const transactions = await this.prisma.transaction.findMany({
      where: whereParams,
      orderBy: {
        date: "desc",
      },
      include: categoryInclude,
    });

    // Agrupar por data
    const grouped = transactions.reduce(
      (acc, transaction) => {
        const dateKey = dayjs(transaction.date).utc().format("YYYY-MM-DD");

        if (!acc[dateKey]) {
          acc[dateKey] = { transactions: [], total: 0 };
        }

        acc[dateKey].transactions.push(transaction);
        acc[dateKey].total += 1;
        return acc;
      },
      {} as Record<string, { transactions: Transaction[]; total: number }>,
    );

    return Object.entries(grouped).map(([date, data]) => ({
      date,
      transactions: data.transactions,
      total: data.total,
    }));
  }

  /* Obtém transações por período */
  async getByPeriod({
    year,
    month,
    userId,
    search,
    categoryIds,
    type,
  }: GetTransactionByMonthDto & { userId: string }) {
    // Aplicar valores padrão se não fornecidos
    const yearFormat = year ?? dayjs().year();
    const monthFormat = month ?? dayjs().month() + 1;

    const whereParams = buildTransactionWhereClause({
      userId,
      year: yearFormat,
      month: monthFormat,
      search,
      categoryIds,
      type,
    });

    const transactions = await this.prisma.transaction.findMany({
      where: whereParams,
      orderBy: {
        date: "desc",
      },
      include: categoryInclude,
    });

    const balance = calculateBalance(transactions);

    return {
      transactions,
      total: transactions.length,
      month: monthFormat,
      year: yearFormat,
      balance: {
        ...balance,
        total: balance.balance,
      },
    };
  }

  /* Obtém o saldo de transações por período */
  async getBalance({
    year,
    month,
    userId,
  }: {
    year?: number;
    month?: number;
    userId: string;
  }) {
    // Aplicar valores padrão se não fornecidos
    const yearFormat = year ?? dayjs().year();
    const monthFormat = month ?? dayjs().month() + 1;

    const whereParams = buildTransactionWhereClause({
      userId,
      year: yearFormat,
      month: monthFormat,
    });

    const transactions = await this.prisma.transaction.findMany({
      where: whereParams,
    });

    return calculateBalance(transactions);
  }

  /* Obtém os meses disponíveis para um usuário */
  async getAvailableMonthsOptions(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      select: {
        date: true,
      },
    });

    const options = transactions.reduce<
      Array<{ months: { name: string; value: number }[]; year: number }>
    >((acc, transaction) => {
      const date = dayjs(transaction.date);
      const year = date.year();
      const month = date.month() + 1;

      const monthName = months.find((m) => m.value === month)?.label;

      if (!monthName) return acc;

      const monthData = { name: monthName, value: month };

      const existingYear = acc.find((o) => o.year === year);

      if (existingYear) {
        const monthExists = existingYear.months?.find(
          (m) => m.value === monthData.value,
        );

        if (!monthExists) {
          existingYear.months.push(monthData);
        }
      } else {
        acc.push({ year, months: [monthData] });
      }
      return acc;
    }, []);

    return options
      ?.sort((a, b) => b.year - a.year)
      ?.map((o) => ({
        year: o.year,
        months: o.months.sort((a, b) => a.value - b.value),
      }));
  }

  /* Cria uma nova transação */
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
