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
import {
  CreateCategoryDto,
  GetParamsCategoryDto,
  UpdateCategoryDto,
} from "./dtos";
import { CategoryService } from "./category.service";

@Controller("categories")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  get(@Query() { id, name, limit = 10, page = 1, type }: GetParamsCategoryDto) {
    return this.categoryService.get({ id, name, limit, page, type });
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.categoryService.getById(id);
  }

  @Post()
  async create(@Body() data: CreateCategoryDto) {
    return await this.categoryService.create(data);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() data: UpdateCategoryDto) {
    return await this.categoryService.update(id, data);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    return this.categoryService.delete(id);
  }
}
