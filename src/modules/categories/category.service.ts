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

  private visibleTo(userId: string) {
    return { OR: [{ userId }, { userId: null }, { userId: { isSet: false } }] };
  }

  async assertOwned(id: string, userId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });
    if (!category)
      throw new HttpException(
        "Categoria não encontrada ou não editável",
        HttpStatus.NOT_FOUND,
      );
    return category;
  }

  async get(
    { id, name, type, page, limit }: GetParamsCategoryDto,
    userId: string,
  ): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: {
        ...this.visibleTo(userId),
        name: { contains: name },
        id,
        type,
      },
      ...(limit &&
        page && {
          take: limit,
          skip: (page - 1) * limit,
        }),
    });
  }

  async getById(id: string, userId: string): Promise<Category | null> {
    return await this.prisma.category.findFirst({
      where: { id, ...this.visibleTo(userId) },
    });
  }

  async create(
    { name, description, type, color, icon }: CreateCategoryDto,
    userId: string,
  ): Promise<Category> {
    const hasCategory = await this.prisma.category.findFirst({
      where: { name, type, ...this.visibleTo(userId) },
    });

    if (hasCategory) {
      throw new HttpException("Categoria já existe", HttpStatus.BAD_REQUEST);
    }

    return await this.prisma.category.create({
      data: {
        userId,
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

  async update(
    id: string,
    data: UpdateCategoryDto,
    userId: string,
  ): Promise<Category> {
    await this.assertOwned(id, userId);

    return await this.prisma.category.update({
      where: { id, userId },
      data: {
        ...data,
        status: {
          updatedAt: new Date(),
        },
      },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.assertOwned(id, userId);
    await this.prisma.category.delete({
      where: { id, userId },
    });
  }
}
