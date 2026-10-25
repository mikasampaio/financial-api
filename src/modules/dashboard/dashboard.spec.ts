import { DashboardService } from "./dashboard.service";
import { ReportService } from "../reports/report.service";
import { ValidationPipe } from "@nestjs/common";
import { PeriodFilterDto } from "src/common/dtos/period.dto";

describe("Dashboard e comparativos", () => {
  it("preenche seis meses e acumula saldo anterior na virada de ano", async () => {
    const groupBy = jest
      .fn()
      .mockResolvedValueOnce([{ type: "INCOME", _sum: { amount: 100 } }])
      .mockResolvedValueOnce([
        {
          date: new Date("2025-09-15T00:00:00Z"),
          type: "EXPENSE",
          _sum: { amount: 10.1 },
        },
        {
          date: new Date("2026-02-20T00:00:00Z"),
          type: "INCOME",
          _sum: { amount: 20.2 },
        },
        {
          date: new Date("2026-02-25T00:00:00Z"),
          type: "INCOME",
          _sum: { amount: 0.1 },
        },
      ]);
    const findMany = jest.fn().mockResolvedValue([]);
    const result = await new DashboardService({
      transaction: { groupBy, findMany },
    } as any).get("owner", { year: 2026, month: 2 });
    expect(result.evolution).toHaveLength(6);
    expect(result.evolution[0]).toMatchObject({
      year: 2025,
      month: 9,
      accumulatedBalance: 89.9,
    });
    expect(result.evolution[1]).toMatchObject({
      income: 0,
      expense: 0,
      balance: 0,
      accumulatedBalance: 89.9,
    });
    expect(result.totalBalance).toBe(110.2);
    expect(result.monthlySummary.income).toBe(20.3);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "owner" }),
      }),
    );
  });
  it("compara janeiro com dezembro anterior e não divide por zero", async () => {
    const findMany = jest.fn().mockResolvedValue([
      { date: new Date("2025-12-31T23:59:59Z"), type: "EXPENSE", amount: 20 },
      { date: new Date("2026-01-01T00:00:00Z"), type: "EXPENSE", amount: 30 },
      { date: new Date("2026-01-10T00:00:00Z"), type: "INCOME", amount: 100 },
    ]);
    const result = await new ReportService({
      transaction: { findMany },
    } as any).comparison("owner", { year: 2026, month: 1 });
    expect(result.previous).toMatchObject({
      year: 2025,
      month: 12,
      expense: 20,
    });
    expect(result.current).toMatchObject({
      year: 2026,
      month: 1,
      income: 100,
      expense: 30,
      balance: 70,
    });
    expect(result.change.income.percent).toBeNull();
    expect(result.change.expense.percent).toBe(50);
  });
  it.each([0, 13, 1.5])("rejeita mês inválido %s", async (month) => {
    await expect(
      new ValidationPipe({ transform: true }).transform(
        { month },
        { type: "query", metatype: PeriodFilterDto },
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});
