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
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  GetParamsTransactionDto,
  GetTransactionByMonthDto,
  GetBalanceQueryDto,
} from "./dtos";
import {
  CurrentUserId,
  ParamsId,
} from "src/common/decorators/params.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";
import {
  ApiListTransactions,
  ApiGetBalance,
  ApiGetTransactionById,
  ApiCreateTransaction,
  ApiUpdateTransaction,
  ApiDeleteTransaction,
  ApiGetByPeriod,
  ApiGetAvailableMonthsOptions,
} from "./decorators/transaction-swagger.decorator";

@ApiTags("transactions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("transactions")
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @ApiListTransactions()
  get(
    @CurrentUserId() userId: string,
    @Query() query: GetParamsTransactionDto,
  ) {
    const { page = 1, limit = 10, ...filters } = query;
    return this.transactionService.get({
      page: Number(page),
      limit: Number(limit),
      userId,
      ...filters,
    });
  }

  @Get("grouped-by-date")
  getGroupedByDate(
    @CurrentUserId() userId: string,
    @Query() query: GetTransactionByMonthDto,
  ) {
    return this.transactionService.getGroupedByDate({
      ...query,
      userId,
    });
  }

  @Get("balance")
  @ApiGetBalance()
  getBalance(
    @CurrentUserId() userId: string,
    @Query() query: GetBalanceQueryDto,
  ) {
    return this.transactionService.getBalance({
      ...query,
      userId,
    });
  }

  @Get("period")
  @ApiGetByPeriod()
  getByPeriod(
    @CurrentUserId() userId: string,
    @Query() query: GetTransactionByMonthDto,
  ) {
    return this.transactionService.getByPeriod({
      ...query,
      userId,
    });
  }

  @Get("available-months")
  @ApiGetAvailableMonthsOptions()
  getAvailableMonthsOptions(@CurrentUserId() userId: string) {
    return this.transactionService.getAvailableMonthsOptions(userId);
  }

  @Get(":id")
  @ApiGetTransactionById()
  getById(@CurrentUserId() userId: string, @ParamsId() id: string) {
    return this.transactionService.getById({ id, userId });
  }

  @Post()
  @ApiCreateTransaction()
  create(
    @CurrentUserId() userId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.create({ ...createTransactionDto, userId });
  }

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

  @Delete(":id")
  @ApiDeleteTransaction()
  delete(@CurrentUserId() userId: string, @ParamsId() id: string) {
    return this.transactionService.delete(id, userId);
  }
}
