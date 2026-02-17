import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateCategoryDto,
  GetParamsCategoryDto,
  UpdateCategoryDto,
} from "./dtos";
import { Category } from "src/generated/prisma/client";

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async get({
    id,
    name,
    type,
    page,
    limit,
  }: GetParamsCategoryDto): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: {
        name: { contains: name },
        id,
        type,
      },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async getById(id: string): Promise<Category | null> {
    return await this.prisma.category.findUnique({
      where: { id },
    });
  }

  async create({
    name,
    description,
    type,
    color,
    icon,
  }: CreateCategoryDto): Promise<Category> {
    const hasCategory = await this.prisma.category.findFirst({
      where: { name, type },
    });

    if (hasCategory) {
      throw new HttpException("Categoria já existe", HttpStatus.BAD_REQUEST);
    }

    return await this.prisma.category.create({
      data: {
        name,
        description,
        type,
        color,
        icon,
        status: {
          createdAt: new Date(),
        },
      },
    });
  }

  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new HttpException("Categoria não encontrada", HttpStatus.NOT_FOUND);
    }

    return await this.prisma.category.update({
      where: { id },
      data: {
        ...data,
        status: {
          updatedAt: new Date(),
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }
}
