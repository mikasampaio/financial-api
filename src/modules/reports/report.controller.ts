import {
  Controller,
  Header,
  Get,
  Query,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiProduces,
} from "@nestjs/swagger";
import { ReportService } from "./report.service";
import { ReportExportService } from "./report-export.service";
import { CurrentUserId } from "src/common/decorators/params.decorator";
import { ExportReportDto, GetExpenseByCategoryQueryDto } from "./dtos";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";

@ApiTags("reports")
@ApiBearerAuth()
@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly exporter: ReportExportService,
  ) {}

  @Get("expense-by-category")
  @ApiOperation({ summary: "Distribuição das despesas por categoria" })
  getExpenseByCategory(
    @CurrentUserId() userId: string,
    @Query() query: GetExpenseByCategoryQueryDto,
  ) {
    return this.reportService.getExpenseByCategory({ ...query, userId });
  }

  @Get("incomes-and-expenses")
  @ApiOperation({ summary: "Histórico mensal de receitas e despesas" })
  getIncomesAndExpenses(@CurrentUserId() userId: string) {
    return this.reportService.getIncomesAndExpensesMonthly({ userId });
  }

  @Get("spending-ranking")
  @ApiOperation({ summary: "Ranking mensal de categorias por valor gasto" })
  ranking(
    @CurrentUserId() userId: string,
    @Query() query: GetExpenseByCategoryQueryDto,
  ) {
    return this.reportService.ranking({ ...query, userId });
  }

  @Get("monthly-comparison")
  @ApiOperation({
    summary: "Comparar receitas, despesas e saldo com o mês anterior",
  })
  comparison(
    @CurrentUserId() userId: string,
    @Query() query: GetExpenseByCategoryQueryDto,
  ) {
    return this.reportService.comparison(userId, query);
  }

  @Get("export")
  @Header("Cache-Control", "no-store")
  @ApiProduces(
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  )
  @ApiOperation({ summary: "Exportar relatório mensal em PDF ou Excel" })
  async export(
    @CurrentUserId() userId: string,
    @Query() query: ExportReportDto,
  ) {
    const result = await this.exporter.export(userId, query);
    return new StreamableFile(result.buffer, {
      type: result.type,
      disposition: `attachment; filename="${result.filename}"`,
    });
  }
}
