import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PeriodFilterDto } from "src/common/dtos/period.dto";
import { period, totals } from "src/common/helpers/financial-period.helper";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string, query: PeriodFilterDto) {
    const selected = period(query.year, query.month);
    const firstMonth = new Date(Date.UTC(selected.year, selected.month - 6, 1));
    const [opening, grouped, recentTransactions] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ["type"],
        where: { userId, date: { lt: firstMonth } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ["date", "type"],
        where: { userId, date: { gte: firstMonth, lte: selected.endDate } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.findMany({
        where: { userId, date: { lte: selected.endDate } },
        orderBy: [{ date: "desc" }, { id: "desc" }],
        take: 5,
        include: {
          category: { select: { name: true, color: true, icon: true } },
        },
      }),
    ]);
    let accumulatedCents = Math.round(
      totals(
        opening.map((row) => ({
          type: row.type,
          amount: row._sum.amount ?? 0,
        })),
      ).balance * 100,
    );
    const evolution = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        Date.UTC(
          firstMonth.getUTCFullYear(),
          firstMonth.getUTCMonth() + index,
          1,
        ),
      );
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      const summary = totals(
        grouped
          .filter(
            (row) =>
              row.date.getUTCFullYear() === year &&
              row.date.getUTCMonth() + 1 === month,
          )
          .map((row) => ({ type: row.type, amount: row._sum.amount ?? 0 })),
      );
      accumulatedCents += Math.round(summary.balance * 100);
      return {
        year,
        month,
        ...summary,
        accumulatedBalance: accumulatedCents / 100,
      };
    });
    const current = evolution[5];
    return {
      year: selected.year,
      month: selected.month,
      totalBalance: current.accumulatedBalance,
      monthlySummary: {
        income: current.income,
        expense: current.expense,
        balance: current.balance,
      },
      evolution,
      recentTransactions,
    };
  }
}
