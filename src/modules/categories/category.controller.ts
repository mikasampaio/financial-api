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
import {
  ApiCreateCategory,
  ApiDeleteCategory,
  ApiGetCategoryById,
  ApiListCategories,
  ApiUpdateCategory,
} from "./decorators/swagger.decorator";

@ApiTags("categories")
@Controller("categories")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiListCategories()
  get(@Query() { id, name, limit, page, type }: GetParamsCategoryDto) {
    return this.categoryService.get({ id, name, limit, page, type });
  }

  @Get(":id")
  @ApiGetCategoryById()
  getById(@ParamsId() id: string) {
    return this.categoryService.getById(id);
  }

  @Post()
  @ApiCreateCategory()
  async create(@Body() data: CreateCategoryDto) {
    return await this.categoryService.create(data);
  }

  @Put(":id")
  @ApiUpdateCategory()
  async update(@ParamsId() id: string, @Body() data: UpdateCategoryDto) {
    return await this.categoryService.update(id, data);
  }

  @Delete(":id")
  @ApiDeleteCategory()
  async delete(@ParamsId() id: string) {
    return this.categoryService.delete(id);
  }
}
