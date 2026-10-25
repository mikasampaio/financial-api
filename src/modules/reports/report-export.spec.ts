import { Workbook } from "exceljs";
import { ReportExportService } from "./report-export.service";
import { ReportService } from "./report.service";

const exportData = {
  year: 2026,
  month: 1,
  summary: { income: 200, expense: 50, balance: 150 },
  transactions: [
    {
      date: new Date("2026-01-10T00:00:00Z"),
      type: "EXPENSE",
      amount: 50,
      category: { name: "Alimentação" },
      description: '=HYPERLINK("https://example.com")',
    },
  ],
  ranking: [
    { rank: 1, category: "Alimentação", totalAmount: 50, percent: 100 },
  ],
  comparison: {
    previous: { income: 0, expense: 0, balance: 0 },
    current: { income: 200, expense: 50, balance: 150 },
    change: {
      income: { amount: 200, percent: null },
      expense: { amount: 50, percent: null },
      balance: { amount: 150, percent: null },
    },
  },
};

describe("Exportação de relatórios", () => {
  it("gera XLSX com números e texto sem interpretar fórmulas fornecidas pelo usuário", async () => {
    const reports = { exportData: jest.fn().mockResolvedValue(exportData) };
    const result = await new ReportExportService(reports as any).export(
      "owner",
      { format: "xlsx", year: 2026, month: 1 },
    );
    expect(result.type).toContain("spreadsheetml");
    expect(result.filename).toBe("relatorio-2026-01.xlsx");
    const workbook = new Workbook();
    await workbook.xlsx.load(result.buffer as any);
    expect(workbook.worksheets).toHaveLength(3);
    const transactions = workbook.getWorksheet("Transações")!;
    expect(transactions.getCell("D2").value).toBe(
      exportData.transactions[0].description,
    );
    expect(transactions.getCell("E2").value).toBe(50);
    expect(reports.exportData).toHaveBeenCalledWith(
      "owner",
      expect.objectContaining({ year: 2026 }),
    );
  });
  it("gera um PDF válido para período sem movimentação", async () => {
    const reports = {
      exportData: jest
        .fn()
        .mockResolvedValue({ ...exportData, transactions: [], ranking: [] }),
    };
    const result = await new ReportExportService(reports as any).export(
      "owner",
      {},
    );
    expect(result.type).toBe("application/pdf");
    expect(result.buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(result.buffer.subarray(-20).toString()).toContain("%%EOF");
  });
  it("ordena o ranking por total gasto", async () => {
    const prisma = {
      transaction: {
        groupBy: jest.fn().mockResolvedValue([
          { categoryId: "a", _sum: { amount: 20 }, _count: { id: 1 } },
          { categoryId: "b", _sum: { amount: 80 }, _count: { id: 2 } },
        ]),
      },
      category: {
        findMany: jest.fn().mockResolvedValue([
          { id: "a", name: "A" },
          { id: "b", name: "B" },
        ]),
      },
    };
    const result = await new ReportService(prisma as any).ranking({
      userId: "owner",
      year: 2026,
      month: 1,
    });
    expect(result.map((row) => [row.rank, row.category, row.percent])).toEqual([
      [1, "B", 80],
      [2, "A", 20],
    ]);
    expect(prisma.transaction.groupBy.mock.calls[0][0].where.userId).toBe(
      "owner",
    );
  });
});
