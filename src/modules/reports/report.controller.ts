import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ReportService } from "./report.service";
import { CurrentUserId } from "src/common/decorators/params.decorator";
import { GetExpenseByCategoryQueryDto } from "./dtos";
import { AuthGuard } from "@nestjs/passport";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get("expense-by-category")
  async getExpenseByCategory(
    @CurrentUserId() userId: string,
    @Query() query: GetExpenseByCategoryQueryDto,
  ) {
    return this.reportService.getExpenseByCategory({ ...query, userId });
  }

  @Get("incomes-and-expenses")
  async getIncomesAndExpenses(@CurrentUserId() userId: string) {
    return this.reportService.getIncomesAndExpensesMonthly({ userId });
  }
}
