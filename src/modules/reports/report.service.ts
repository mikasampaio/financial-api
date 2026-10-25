import { period, totals } from "src/common/helpers/financial-period.helper";
import { Injectable } from "@nestjs/common";
import {
  GetExpenseByCategoryQueryDto,
  GetIncomesAndExpensesQueryDto,
} from "./dtos";
import { PrismaService } from "../prisma/prisma.service";
import { calculatePeriodDates } from "src/common/helpers/calculate-period-dates.helper";
import { TransactionType } from "@prisma/client";

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getExpenseByCategory({
    month,
    year,
    userId,
  }: GetExpenseByCategoryQueryDto & { userId: string }) {
    const monthDefault = month ? month : new Date().getUTCMonth() + 1;
    const yearDefault = year ? year : new Date().getUTCFullYear();

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
        categoryId: expense.categoryId,
        category: category ? category.name : "Sem categoria",
        color: category ? category.color : "#000000",
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

  async ranking(query: GetExpenseByCategoryQueryDto & { userId: string }) {
    const categories = await this.getExpenseByCategory(query);
    return categories
      .sort(
        (a, b) =>
          (b.totalAmount ?? 0) - (a.totalAmount ?? 0) ||
          a.category.localeCompare(b.category),
      )
      .map((row, index) => ({ rank: index + 1, ...row }));
  }

  async comparison(userId: string, query: GetExpenseByCategoryQueryDto) {
    const current = period(query.year, query.month);
    const previousDate = new Date(Date.UTC(current.year, current.month - 2, 1));
    const previous = period(
      previousDate.getUTCFullYear(),
      previousDate.getUTCMonth() + 1,
    );
    const rows = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: previous.startDate, lte: current.endDate },
      },
      select: { date: true, type: true, amount: true },
    });
    const currentTotals = totals(
      rows.filter((row) => row.date >= current.startDate),
    );
    const previousTotals = totals(
      rows.filter((row) => row.date < current.startDate),
    );
    const change = (value: number, old: number) => ({
      amount: Math.round((value - old) * 100) / 100,
      percent:
        old === 0
          ? null
          : Math.round(((value - old) / Math.abs(old)) * 10000) / 100,
    });
    return {
      current: { year: current.year, month: current.month, ...currentTotals },
      previous: {
        year: previous.year,
        month: previous.month,
        ...previousTotals,
      },
      change: {
        income: change(currentTotals.income, previousTotals.income),
        expense: change(currentTotals.expense, previousTotals.expense),
        balance: change(currentTotals.balance, previousTotals.balance),
      },
    };
  }

  async exportData(userId: string, query: GetExpenseByCategoryQueryDto) {
    const selected = period(query.year, query.month);
    const [transactions, ranking, comparison] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: selected.startDate, lte: selected.endDate },
        },
        include: { category: { select: { name: true } } },
        orderBy: [{ date: "asc" }, { id: "asc" }],
      }),
      this.ranking({ ...query, userId }),
      this.comparison(userId, query),
    ]);
    return {
      year: selected.year,
      month: selected.month,
      summary: totals(transactions),
      transactions,
      ranking,
      comparison,
    };
  }

  async getIncomesAndExpensesMonthly({
    userId,
  }: GetIncomesAndExpensesQueryDto & { userId: string }) {
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
        const month = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ][transaction.date.getUTCMonth()];
        const year = transaction.date.getUTCFullYear();
        const existingMonth = acc.find(
          (m) => m.month === month && m.year === year,
        );

        if (existingMonth) {
          if (transaction.type === TransactionType.INCOME)
            existingMonth.income += transaction._sum.amount || 0;
          else existingMonth.expense += transaction._sum.amount || 0;
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
