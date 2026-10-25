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
import {
  CreateCategoryDto,
  GetParamsCategoryDto,
  UpdateCategoryDto,
} from "./dtos";
import { CategoryService } from "./category.service";
import {
  CurrentUserId,
  ParamsId,
} from "src/common/decorators/params.decorator";
import {
  ApiCreateCategory,
  ApiDeleteCategory,
  ApiGetCategoryById,
  ApiListCategories,
  ApiUpdateCategory,
} from "./decorators/swagger.decorator";

import { JwtAuthGuard } from "src/common/guards/jwt.guard";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags("categories")
@Controller("categories")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiListCategories()
  get(
    @CurrentUserId() userId: string,
    @Query() { id, name, limit, page, type }: GetParamsCategoryDto,
  ) {
    return this.categoryService.get({ id, name, limit, page, type }, userId);
  }

  @Get(":id")
  @ApiGetCategoryById()
  getById(@CurrentUserId() userId: string, @ParamsId() id: string) {
    return this.categoryService.getById(id, userId);
  }

  @Post()
  @ApiCreateCategory()
  async create(
    @CurrentUserId() userId: string,
    @Body() data: CreateCategoryDto,
  ) {
    return await this.categoryService.create(data, userId);
  }

  @Put(":id")
  @ApiUpdateCategory()
  async update(
    @CurrentUserId() userId: string,
    @ParamsId() id: string,
    @Body() data: UpdateCategoryDto,
  ) {
    return await this.categoryService.update(id, data, userId);
  }

  @Delete(":id")
  @ApiDeleteCategory()
  async delete(@CurrentUserId() userId: string, @ParamsId() id: string) {
    return this.categoryService.delete(id, userId);
  }
}
