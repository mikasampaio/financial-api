import { calculatePeriodDates } from "./calculate-period-dates.helper";

export function period(year?: number, month?: number, now = new Date()) {
  const selectedYear = year ?? now.getUTCFullYear();
  const selectedMonth = month ?? now.getUTCMonth() + 1;
  return {
    year: selectedYear,
    month: selectedMonth,
    ...calculatePeriodDates(selectedYear, selectedMonth),
  };
}

export function totals(rows: Array<{ type: string; amount: number }>) {
  const cents = rows.reduce(
    (acc, row) => {
      acc[row.type === "INCOME" ? "income" : "expense"] += Math.round(
        row.amount * 100,
      );
      return acc;
    },
    { income: 0, expense: 0 },
  );
  return {
    income: cents.income / 100,
    expense: cents.expense / 100,
    balance: (cents.income - cents.expense) / 100,
  };
}
