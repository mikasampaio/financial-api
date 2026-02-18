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
import { TransactionService } from "./transaction.service";
import { GetParamsCategoryDto } from "../categories/dtos";
import { CreateTransactionDto, UpdateTransactionDto } from "./dtos";
import {
  CurrentUserId,
  ParamsId,
} from "src/common/decorators/params.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";

@Controller("transactions")
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  get(
    @CurrentUserId() userId: string,
    @Query() { page = 1, limit = 10, ...filters }: GetParamsCategoryDto,
  ) {
    return this.transactionService.get({ page, limit, userId, ...filters });
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  getById(@CurrentUserId() userId: string, @ParamsId() id: string) {
    return this.transactionService.getById({ id, userId });
  }

  @UseGuards(JwtAuthGuard)
  @Get(":year/:month")
  getByMonth(
    @CurrentUserId() userId: string,
    @Param("year") year: number,
    @Param("month") month: number,
  ) {
    return this.transactionService.getByMonth({ year, month, userId });
  }

  @UseGuards(JwtAuthGuard)
  @Get("/balance/:year/:month")
  getBalance(
    @CurrentUserId() userId: string,
    @Param("year") year: number,
    @Param("month") month: number,
  ) {
    return this.transactionService.getBalance({ year, month, userId });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.create({ ...createTransactionDto, userId });
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id")
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
  delete(@CurrentUserId() userId: string, @ParamsId() id: string) {
    return this.transactionService.delete(id, userId);
  }
}
