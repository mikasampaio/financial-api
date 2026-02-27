import { Injectable } from "@nestjs/common";
import {
  GetExpenseByCategoryQueryDto,
  GetIncomesAndExpensesQueryDto,
} from "./dtos";
import { PrismaService } from "../prisma/prisma.service";
import dayjs from "dayjs";
import { calculatePeriodDates } from "src/common/helpers/calculate-period-dates.helper";
import { TransactionType } from "@prisma/client";

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getExpenseByCategory({
    month,
    year,
    userId,
  }: GetExpenseByCategoryQueryDto) {
    const monthDefault = month ? month : dayjs().month() + 1;
    const yearDefault = year ? year : dayjs().year();

    const period = calculatePeriodDates(yearDefault, monthDefault);

    const where = {
      userId,
      type: TransactionType.EXPENSE,
      date: {
        gte: new Date(period.startDate),
        lte: new Date(period.endDate),
      },
    };

    const expenses = await this.prisma.transaction.groupBy({
      by: ["categoryId"],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const categoryIds = expenses
      .map((expense) => expense.categoryId)
      ?.filter((id): id is string => !!id);

    const categories = await this.prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
    });

    return expenses.map((expense) => {
      const category = categories.find((cat) => cat.id === expense.categoryId);
      return {
        category: category ? category.name : "Sem categoria",
        totalAmount: expense._sum.amount,
        transactionCount: expense._count.id,
        percent: expense._sum.amount
          ? (expense._sum.amount /
              expenses.reduce(
                (acc, curr) => acc + (curr._sum.amount || 0),
                0,
              )) *
            100
          : 0,
      };
    });
  }

  async getIncomesAndExpensesMonthly({
    userId,
  }: GetIncomesAndExpensesQueryDto) {
    const transactions = await this.prisma.transaction.groupBy({
      by: ["date", "type"],
      where: {
        userId,
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return transactions.reduce(
      (acc, transaction) => {
        const month = dayjs(transaction.date).format("MMMM");
        const year = dayjs(transaction.date).year();
        const existingMonth = acc.find(
          (m) => m.month === month && m.year === year,
        );

        if (existingMonth) {
          if (transaction.type === TransactionType.INCOME)
            existingMonth.income = transaction._sum.amount || 0;
          else existingMonth.expense = transaction._sum.amount || 0;
        } else {
          acc.push({
            month,
            year,
            income:
              transaction.type === TransactionType.INCOME
                ? transaction._sum.amount || 0
                : 0,
            expense:
              transaction.type === TransactionType.EXPENSE
                ? transaction._sum.amount || 0
                : 0,
          });
        }

        return acc;
      },
      [] as Array<{
        month: string;
        year: number;
        income: number;
        expense: number;
      }>,
    );
  }
}
