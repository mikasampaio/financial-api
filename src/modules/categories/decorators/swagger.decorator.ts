import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from "@nestjs/swagger";

export function ApiListCategories() {
  return applyDecorators(
    ApiOperation({ summary: "Listar categorias com filtros e paginação" }),
    ApiResponse({
      status: 200,
      description: "Lista de categorias retornada com sucesso",
    }),
  );
}

export function ApiGetCategoryById() {
  return applyDecorators(
    ApiOperation({ summary: "Buscar categoria por ID" }),
    ApiResponse({ status: 200, description: "Categoria encontrada" }),
    ApiResponse({ status: 404, description: "Categoria não encontrada" }),
  );
}

export function ApiCreateCategory() {
  return applyDecorators(
    ApiOperation({ summary: "Criar nova categoria" }),
    ApiResponse({ status: 201, description: "Categoria criada com sucesso" }),
    ApiResponse({ status: 400, description: "Dados inválidos" }),
  );
}

export function ApiUpdateCategory() {
  return applyDecorators(
    ApiOperation({ summary: "Atualizar categoria" }),
    ApiResponse({
      status: 200,
      description: "Categoria atualizada com sucesso",
    }),
    ApiResponse({ status: 404, description: "Categoria não encontrada" }),
  );
}

export function ApiDeleteCategory() {
  return applyDecorators(
    ApiOperation({ summary: "Deletar categoria" }),
    ApiResponse({ status: 200, description: "Categoria deletada com sucesso" }),
    ApiResponse({ status: 404, description: "Categoria não encontrada" }),
  );
}
