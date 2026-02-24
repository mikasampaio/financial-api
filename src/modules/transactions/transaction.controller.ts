import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { TransactionService } from "./transaction.service";
import { GetParamsCategoryDto } from "../categories/dtos";
import { CreateTransactionDto, UpdateTransactionDto } from "./dtos";
import {
  CurrentUserId,
  ParamsId,
} from "src/common/decorators/params.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";
import dayjs from "dayjs";
import {
  ApiListTransactions,
  ApiGetBalance,
  ApiGetTransactionById,
  ApiCreateTransaction,
  ApiUpdateTransaction,
  ApiDeleteTransaction,
  ApiGetByPeriod,
  ApiGetAvailableMonthsOptions,
} from "./decorators/swagger.decorator";

@ApiTags("transactions")
@ApiBearerAuth()
@Controller("transactions")
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiListTransactions()
  get(
    @CurrentUserId() userId: string,
    @Query() { page = 1, limit = 10, ...filters }: GetParamsCategoryDto,
  ) {
    return this.transactionService.get({
      page: Number(page),
      limit: Number(limit),
      userId,
      ...filters,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("balance")
  @ApiGetBalance()
  getBalance(
    @CurrentUserId() userId: string,
    @Query("year") year: number,
    @Query("month") month: number,
  ) {
    const yearFormat = year ? year : dayjs().year();
    const monthFormat = month ? month : dayjs().month() + 1;

    return this.transactionService.getBalance({
      year: yearFormat,
      month: monthFormat,
      userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("period")
  @ApiGetByPeriod()
  getByPeriod(
    @CurrentUserId() userId: string,
    @Query("year") year: number,
    @Query("month") month: number,
    @Query("categoryIds") categoryIds?: string,
    @Query("type") type?: "INCOME" | "EXPENSE",
    @Query("search") search?: string,
  ) {
    const yearFormat = year ? year : dayjs().year();
    const monthFormat = month ? month : dayjs().month() + 1;

    return this.transactionService.getByPeriod({
      year: yearFormat,
      month: monthFormat,
      userId,
      categoryIds,
      type,
      search,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("available-months")
  @ApiGetAvailableMonthsOptions()
  getAvailableMonthsOptions(@CurrentUserId() userId: string) {
    return this.transactionService.getAvailableMonthsOptions(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  @ApiGetTransactionById()
  getById(@CurrentUserId() userId: string, @ParamsId() id: string) {
    return this.transactionService.getById({ id, userId });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiCreateTransaction()
  create(
    @CurrentUserId() userId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.create({ ...createTransactionDto, userId });
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id")
  @ApiUpdateTransaction()
  update(
    @CurrentUserId() userId: string,
    @ParamsId() id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, {
      ...updateTransactionDto,
      userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  @ApiDeleteTransaction()
  delete(@CurrentUserId() userId: string, @ParamsId() id: string) {
    return this.transactionService.delete(id, userId);
  }
}
