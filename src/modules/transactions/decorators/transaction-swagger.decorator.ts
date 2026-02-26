import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from "@nestjs/swagger";

export function ApiListTransactions() {
  return applyDecorators(
    ApiOperation({ summary: "Listar transações com filtros e paginação" }),
    ApiResponse({
      status: 200,
      description: "Lista de transações retornada com sucesso",
    }),
    ApiResponse({ status: 401, description: "Não autorizado" }),
  );
}

export function ApiGetBalance() {
  return applyDecorators(
    ApiOperation({ summary: "Buscar balanço do mês" }),
    ApiQuery({
      name: "year",
      description: "Ano",
      example: 2024,
      required: false,
    }),
    ApiQuery({
      name: "month",
      description: "Mês",
      example: 2,
      required: false,
    }),
    ApiResponse({
      status: 200,
      description: "Balanço do mês retornado com sucesso",
    }),
    ApiResponse({ status: 401, description: "Não autorizado" }),
  );
}

export function ApiGetByPeriod() {
  return applyDecorators(
    ApiOperation({ summary: "Buscar transações por mês e ano" }),
    ApiQuery({
      name: "year",
      description: "Ano",
      example: 2024,
      required: false,
    }),
    ApiQuery({
      name: "month",
      description: "Mês",
      example: 2,
      required: false,
    }),
    ApiQuery({
      name: "categoryId",
      description: "ID da categoria",
      required: false,
    }),
    ApiQuery({
      name: "type",
      description: "Tipo da transação",
      enum: ["INCOME", "EXPENSE"],
      required: false,
    }),
    ApiQuery({
      name: "search",
      description: "Buscar por descrição",
      required: false,
    }),
    ApiResponse({
      status: 200,
      description: "Transações do mês retornadas com sucesso",
    }),
    ApiResponse({ status: 401, description: "Não autorizado" }),
  );
}

export function ApiGetTransactionById() {
  return applyDecorators(
    ApiOperation({ summary: "Buscar transação por ID" }),
    ApiParam({ name: "id", description: "ID da transação" }),
    ApiResponse({ status: 200, description: "Transação encontrada" }),
    ApiResponse({ status: 401, description: "Não autorizado" }),
    ApiResponse({ status: 404, description: "Transação não encontrada" }),
  );
}

export function ApiCreateTransaction() {
  return applyDecorators(
    ApiOperation({ summary: "Criar nova transação" }),
    ApiResponse({ status: 201, description: "Transação criada com sucesso" }),
    ApiResponse({ status: 400, description: "Dados inválidos" }),
    ApiResponse({ status: 401, description: "Não autorizado" }),
    ApiResponse({ status: 404, description: "Categoria não encontrada" }),
  );
}

export function ApiUpdateTransaction() {
  return applyDecorators(
    ApiOperation({ summary: "Atualizar transação" }),
    ApiParam({ name: "id", description: "ID da transação" }),
    ApiResponse({
      status: 200,
      description: "Transação atualizada com sucesso",
    }),
    ApiResponse({ status: 400, description: "Dados inválidos" }),
    ApiResponse({ status: 401, description: "Não autorizado" }),
    ApiResponse({
      status: 404,
      description: "Transação ou categoria não encontrada",
    }),
  );
}

export function ApiDeleteTransaction() {
  return applyDecorators(
    ApiOperation({ summary: "Deletar transação" }),
    ApiParam({ name: "id", description: "ID da transação" }),
    ApiResponse({ status: 200, description: "Transação deletada com sucesso" }),
    ApiResponse({ status: 401, description: "Não autorizado" }),
    ApiResponse({ status: 404, description: "Transação não encontrada" }),
  );
}

export function ApiGetAvailableMonthsOptions() {
  return applyDecorators(
    ApiOperation({ summary: "Buscar opções de meses disponíveis" }),
    ApiResponse({
      status: 200,
      description: "Opções de meses retornadas com sucesso",
    }),
    ApiResponse({ status: 401, description: "Não autorizado" }),
  );
}
