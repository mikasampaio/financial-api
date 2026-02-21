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
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  CreateCategoryDto,
  GetParamsCategoryDto,
  UpdateCategoryDto,
} from "./dtos";
import { CategoryService } from "./category.service";
import { ParamsId } from "src/common/decorators/params.decorator";

@ApiTags("categories")
@Controller("categories")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: "Listar categorias com filtros e paginação" })
  @ApiResponse({
    status: 200,
    description: "Lista de categorias retornada com sucesso",
  })
  get(@Query() { id, name, limit = 10, page = 1, type }: GetParamsCategoryDto) {
    return this.categoryService.get({ id, name, limit, page, type });
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar categoria por ID" })
  @ApiResponse({ status: 200, description: "Categoria encontrada" })
  @ApiResponse({ status: 404, description: "Categoria não encontrada" })
  getById(@ParamsId() id: string) {
    return this.categoryService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: "Criar nova categoria" })
  @ApiResponse({ status: 201, description: "Categoria criada com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  async create(@Body() data: CreateCategoryDto) {
    return await this.categoryService.create(data);
  }

  @Put(":id")
  @ApiOperation({ summary: "Atualizar categoria" })
  @ApiResponse({ status: 200, description: "Categoria atualizada com sucesso" })
  @ApiResponse({ status: 404, description: "Categoria não encontrada" })
  async update(@ParamsId() id: string, @Body() data: UpdateCategoryDto) {
    return await this.categoryService.update(id, data);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Deletar categoria" })
  @ApiResponse({ status: 200, description: "Categoria deletada com sucesso" })
  @ApiResponse({ status: 404, description: "Categoria não encontrada" })
  async delete(@ParamsId() id: string) {
    return this.categoryService.delete(id);
  }
}
