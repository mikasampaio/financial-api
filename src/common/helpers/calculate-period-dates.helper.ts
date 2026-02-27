import dayjs from "dayjs";

/* Calcula as datas de início e fim de um período (mês/ano) */
export function calculatePeriodDates(year: number, month: number) {
  const startDate = dayjs(new Date(year, month - 1, 1))
    .startOf("day")
    .toDate();

  const endDate = dayjs(startDate).endOf("month").startOf("day").toDate();

  return { startDate, endDate };
}
