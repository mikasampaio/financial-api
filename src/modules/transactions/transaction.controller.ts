import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { GetParamsCategoryDto } from "../categories/dtos";
import { CreateTransactionDto, UpdateTransactionDto } from "./dtos";
import { ParamsId } from "src/common/decorators/params.decorator";

@Controller("transactions")
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  get(@Query() { page = 1, limit = 10, ...filters }: GetParamsCategoryDto) {
    return this.transactionService.get({ page, limit, ...filters });
  }

  @Get(":id")
  getById(@ParamsId() id: string) {
    return this.transactionService.getById(id);
  }

  @Get(":year/:month")
  getByMonth(@Param("year") year: number, @Param("month") month: number) {
    return this.transactionService.getByMonth(year, month);
  }

  @Get("/balance/:year/:month")
  getBalance(@Param("year") year: number, @Param("month") month: number) {
    return this.transactionService.getBalance(year, month);
  }

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto);
  }

  @Put(":id")
  update(
    @ParamsId() id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, updateTransactionDto);
  }

  @Delete(":id")
  delete(@ParamsId() id: string) {
    return this.transactionService.delete(id);
  }
}
