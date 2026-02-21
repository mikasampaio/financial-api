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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { TransactionService } from "./transaction.service";
import { GetParamsCategoryDto } from "../categories/dtos";
import { CreateTransactionDto, UpdateTransactionDto } from "./dtos";
import {
  CurrentUserId,
  ParamsId,
} from "src/common/decorators/params.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";

@ApiTags("transactions")
@ApiBearerAuth()
@Controller("transactions")
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: "Listar transações com filtros e paginação" })
  @ApiResponse({
    status: 200,
    description: "Lista de transações retornada com sucesso",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  get(
    @CurrentUserId() userId: string,
    @Query() { page = 1, limit = 10, ...filters }: GetParamsCategoryDto,
  ) {
    return this.transactionService.get({ page, limit, userId, ...filters });
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  @ApiOperation({ summary: "Buscar transação por ID" })
  @ApiResponse({ status: 200, description: "Transação encontrada" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 404, description: "Transação não encontrada" })
  getById(@CurrentUserId() userId: string, @ParamsId() id: string) {
    return this.transactionService.getById({ id, userId });
  }

  @UseGuards(JwtAuthGuard)
  @Get(":year/:month")
  @ApiOperation({ summary: "Buscar transações por mês e ano" })
  @ApiParam({ name: "year", description: "Ano", example: 2024 })
  @ApiParam({ name: "month", description: "Mês", example: 2 })
  @ApiResponse({
    status: 200,
    description: "Transações do mês retornadas com sucesso",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  getByMonth(
    @CurrentUserId() userId: string,
    @Param("year") year: number,
    @Param("month") month: number,
  ) {
    return this.transactionService.getByMonth({ year, month, userId });
  }

  @UseGuards(JwtAuthGuard)
  @Get("/balance/:year/:month")
  @ApiOperation({ summary: "Buscar balanço do mês" })
  @ApiParam({ name: "year", description: "Ano", example: 2024 })
  @ApiParam({ name: "month", description: "Mês", example: 2 })
  @ApiResponse({
    status: 200,
    description: "Balanço do mês retornado com sucesso",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  getBalance(
    @CurrentUserId() userId: string,
    @Param("year") year: number,
    @Param("month") month: number,
  ) {
    return this.transactionService.getBalance({ year, month, userId });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: "Criar nova transação" })
  @ApiResponse({ status: 201, description: "Transação criada com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  create(
    @CurrentUserId() userId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.create({ ...createTransactionDto, userId });
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id")
  @ApiOperation({ summary: "Atualizar transação" })
  @ApiResponse({ status: 200, description: "Transação atualizada com sucesso" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 404, description: "Transação não encontrada" })
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
  @ApiOperation({ summary: "Deletar transação" })
  @ApiResponse({ status: 200, description: "Transação deletada com sucesso" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 404, description: "Transação não encontrada" })
  delete(@CurrentUserId() userId: string, @ParamsId() id: string) {
    return this.transactionService.delete(id, userId);
  }
}
