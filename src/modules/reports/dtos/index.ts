import { IntersectionType } from "@nestjs/swagger";
import { UserIdFilterDto } from "src/common/dtos/userId.dto";
import { PeriodFilterDto } from "src/common/dtos/period.dto";

export class GetExpenseByCategoryQueryDto extends IntersectionType(
  PeriodFilterDto,
  UserIdFilterDto,
) {}

export class GetIncomesAndExpensesQueryDto extends UserIdFilterDto {}
