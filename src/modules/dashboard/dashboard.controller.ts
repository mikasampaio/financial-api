import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUserId } from "src/common/decorators/params.decorator";
import { PeriodFilterDto } from "src/common/dtos/period.dto";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";
import { DashboardService } from "./dashboard.service";

@ApiTags("dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly service: DashboardService) {}
  @Get()
  @ApiOperation({
    summary:
      "Saldo acumulado, resumo mensal, evolução de seis meses e transações recentes",
  })
  get(@CurrentUserId() userId: string, @Query() query: PeriodFilterDto) {
    return this.service.get(userId, query);
  }
}
