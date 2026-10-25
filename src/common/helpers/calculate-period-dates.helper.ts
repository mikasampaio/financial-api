/* Períodos financeiros usam UTC, inclusive o último milissegundo do mês. */
export function calculatePeriodDates(year: number, month: number) {
  return {
    startDate: new Date(Date.UTC(year, month - 1, 1)),
    endDate: new Date(Date.UTC(year, month, 1) - 1),
  };
}
