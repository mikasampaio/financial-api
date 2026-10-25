import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { Workbook } from "exceljs";
import { ReportService } from "./report.service";
import { ExportReportDto } from "./dtos";

@Injectable()
export class ReportExportService {
  constructor(private readonly reports: ReportService) {}

  async export(userId: string, query: ExportReportDto) {
    const data = await this.reports.exportData(userId, query);
    const format = query.format ?? "pdf";
    const filename = `relatorio-${data.year}-${String(data.month).padStart(2, "0")}.${format}`;
    const buffer =
      format === "xlsx" ? await this.xlsx(data) : await this.pdf(data);
    return {
      buffer,
      filename,
      type:
        format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  }

  private async xlsx(data: Awaited<ReturnType<ReportService["exportData"]>>) {
    const workbook = new Workbook();
    workbook.creator = "Controle financeiro";
    const summary = workbook.addWorksheet("Resumo");
    summary.addRows([
      ["Relatório financeiro", `${data.month}/${data.year}`],
      ["Receitas", data.summary.income],
      ["Despesas", data.summary.expense],
      ["Saldo", data.summary.balance],
      [],
      ["Indicador", "Mês anterior", "Mês atual", "Variação", "Variação %"],
      ...(["income", "expense", "balance"] as const).map((key) => [
        key,
        data.comparison.previous[key],
        data.comparison.current[key],
        data.comparison.change[key].amount,
        data.comparison.change[key].percent,
      ]),
    ]);
    const transactions = workbook.addWorksheet("Transações");
    transactions.columns = [
      { header: "Data (UTC)", key: "date", width: 25 },
      { header: "Tipo", key: "type", width: 15 },
      { header: "Categoria", key: "category", width: 25 },
      { header: "Descrição", key: "description", width: 45 },
      { header: "Valor", key: "amount", width: 18 },
    ];
    for (const row of data.transactions)
      transactions.addRow({
        date: row.date.toISOString(),
        type: row.type === "INCOME" ? "Receita" : "Despesa",
        category: row.category?.name ?? "Sem categoria",
        description: row.description ?? "",
        amount: row.amount,
      });
    transactions.getColumn("amount").numFmt = "#,##0.00";
    const ranking = workbook.addWorksheet("Ranking");
    ranking.columns = [
      { header: "Posição", key: "rank", width: 12 },
      { header: "Categoria", key: "category", width: 30 },
      { header: "Total", key: "totalAmount", width: 18 },
      { header: "Participação %", key: "percent", width: 20 },
    ];
    ranking.addRows(data.ranking);
    for (const sheet of workbook.worksheets) {
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      sheet.getRow(1).font = { bold: true };
      if (sheet === summary)
        sheet.columns.forEach((column) => {
          column.width = 25;
        });
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private pdf(
    data: Awaited<ReturnType<ReportService["exportData"]>>,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 45 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      const money = (value: number) =>
        value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const section = (title: string) => {
        if (doc.y > 680) doc.addPage();
        doc.moveDown().fontSize(14).text(title).moveDown(0.5).fontSize(10);
      };
      doc.fontSize(22).text("Relatório financeiro");
      doc
        .fontSize(12)
        .text(
          `${String(data.month).padStart(2, "0")}/${data.year} — valores em BRL`,
        );
      section("Resumo");
      doc
        .text(`Receitas: ${money(data.summary.income)}`)
        .text(`Despesas: ${money(data.summary.expense)}`)
        .text(`Saldo: ${money(data.summary.balance)}`);
      section("Comparativo com o mês anterior");
      for (const [key, label] of [
        ["income", "Receitas"],
        ["expense", "Despesas"],
        ["balance", "Saldo"],
      ] as const) {
        const delta = data.comparison.change[key];
        doc.text(
          `${label}: ${money(data.comparison.previous[key])} para ${money(data.comparison.current[key])}; variação ${money(delta.amount)} (${delta.percent === null ? "sem base de comparação" : `${delta.percent}%`})`,
        );
      }
      section("Ranking de gastos");
      if (!data.ranking.length) doc.text("Sem despesas no período.");
      for (const row of data.ranking)
        doc.text(
          `${row.rank}. ${row.category}: ${money(row.totalAmount ?? 0)} (${row.percent.toFixed(2)}%)`,
        );
      section("Transações (UTC)");
      if (!data.transactions.length) doc.text("Sem transações no período.");
      for (const row of data.transactions) {
        if (doc.y > 690) doc.addPage();
        doc.text(
          `${row.date.toISOString().slice(0, 10)} | ${row.type === "INCOME" ? "Receita" : "Despesa"} | ${money(row.amount)} | ${row.category?.name ?? "Sem categoria"}`,
        );
        if (row.description)
          doc.fillColor("#555555").text(row.description).fillColor("#000000");
        doc.moveDown(0.4);
      }
      doc.end();
    });
  }
}
