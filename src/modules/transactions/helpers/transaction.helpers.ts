import dayjs from "dayjs";
import type { Transaction } from "src/generated/prisma/client";

/* Tipos para filtros */
export interface TransactionFilters {
  userId?: string;
  description?: string;
  categoryId?: string;
  categoryIds?: string;
  type?: "INCOME" | "EXPENSE";
  startDate?: string | Date;
  endDate?: string | Date;
  search?: string;
  year?: number;
  month?: number;
}

/* Construtor de filtros WHERE reutilizável */
export function buildTransactionWhereClause(filters: TransactionFilters) {
  const {
    userId,
    description,
    categoryId,
    categoryIds,
    type,
    startDate,
    endDate,
    search,
    year,
    month,
  } = filters;

  // Se year e month forem fornecidos, calcular startDate e endDate
  let periodStart = startDate;
  let periodEnd = endDate;

  if (year && month) {
    const period = calculatePeriodDates(year, month);
    periodStart = period.startDate;
    periodEnd = period.endDate;
  }

  return {
    ...(userId && { userId }),
    ...(description && { description: { contains: description } }),
    ...(categoryId && { categoryId }),
    ...(categoryIds && { categoryId: { in: categoryIds.split(",") } }),
    ...(type && { type }),
    ...(periodStart && {
      date: {
        gte: new Date(periodStart),
        ...(periodEnd && { lte: new Date(periodEnd) }),
      },
    }),
    ...(periodEnd &&
      !periodStart && {
        date: {
          lte: new Date(periodEnd),
        },
      }),
    ...(search && {
      OR: [
        { description: { contains: search } },
        {
          category: {
            name: { contains: search },
          },
        },
      ],
    }),
  };
}

/* Calcula as datas de início e fim de um período (mês/ano) */
export function calculatePeriodDates(year: number, month: number) {
  const startDate = dayjs(new Date(year, month - 1, 1))
    .startOf("day")
    .toDate();

  const endDate = dayjs(startDate).endOf("month").startOf("day").toDate();

  return { startDate, endDate };
}

/* Calcula saldo (income, expense, balance) de uma lista de transações */
export function calculateBalance(transactions: Transaction[]) {
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

/* Include padrão de category */
export const categoryInclude = {
  category: {
    select: {
      name: true,
      color: true,
      icon: true,
    },
  },
};
