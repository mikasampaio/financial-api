import { applyDecorators } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

export function ApiListCategories() {
  return applyDecorators(
    ApiUnauthorizedResponse({ description: "Token ausente ou inválido" }),
    ApiOperation({ summary: "Listar categorias com filtros e paginação" }),
    ApiResponse({
      status: 200,
      description: "Lista de categorias retornada com sucesso",
    }),
  );
}

export function ApiGetCategoryById() {
  return applyDecorators(
    ApiUnauthorizedResponse({ description: "Token ausente ou inválido" }),
    ApiOperation({ summary: "Buscar categoria por ID" }),
    ApiResponse({ status: 200, description: "Categoria encontrada" }),
    ApiResponse({
      status: 404,
      description: "Categoria não encontrada ou sem permissão para a operação",
    }),
  );
}

export function ApiCreateCategory() {
  return applyDecorators(
    ApiUnauthorizedResponse({ description: "Token ausente ou inválido" }),
    ApiOperation({ summary: "Criar nova categoria" }),
    ApiResponse({ status: 201, description: "Categoria criada com sucesso" }),
    ApiResponse({ status: 400, description: "Dados inválidos" }),
  );
}

export function ApiUpdateCategory() {
  return applyDecorators(
    ApiUnauthorizedResponse({ description: "Token ausente ou inválido" }),
    ApiOperation({ summary: "Atualizar categoria própria" }),
    ApiResponse({
      status: 200,
      description: "Categoria atualizada com sucesso",
    }),
    ApiResponse({
      status: 404,
      description: "Categoria não encontrada ou sem permissão para a operação",
    }),
  );
}

export function ApiDeleteCategory() {
  return applyDecorators(
    ApiUnauthorizedResponse({ description: "Token ausente ou inválido" }),
    ApiOperation({ summary: "Deletar categoria própria" }),
    ApiResponse({ status: 200, description: "Categoria deletada com sucesso" }),
    ApiResponse({
      status: 404,
      description: "Categoria não encontrada ou sem permissão para a operação",
    }),
  );
}
