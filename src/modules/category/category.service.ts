/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  /**
   * Create a new category
   */
  async create(data: CreateCategoryDto) {
    const slug = data.slug || this.generateSlug(data.name);

    const isExists = await this.prisma.category.findFirst({
      where: { slug },
    });

    if (isExists) {
      throw new HttpException(
        'Category with this name or slug already exists',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.category.create({
      data: {
        ...data,
        slug,
      },
    });
  }

  /**
   * Get all categories with filtering and pagination
   */
  async findAll(query: Record<string, any>) {
    const {
      page = 1,
      limit = 10,
      searchTerm,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const whereCondition: any = {
      AND: [
        searchTerm
          ? {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
              ],
            }
          : {},
        status ? { status } : {},
      ],
    };

    const [result, total] = await Promise.all([
      this.prisma.category.findMany({
        where: whereCondition,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.category.count({ where: whereCondition }),
    ]);

    return {
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPage: Math.ceil(total / take),
      },
      data: result,
    };
  }

  /**
   * Get a single category
   */
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }

    return category;
  }

  /**
   * Update category
   */
  async update(id: string, data: UpdateCategoryDto) {
    const existingCategory = await this.findOne(id);

    let slug = existingCategory.slug;
    if (data.name && data.name !== existingCategory.name) {
      slug = this.generateSlug(data.name);

      const slugCheck = await this.prisma.category.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (slugCheck) {
        throw new HttpException(
          'Another category already has this name',
          HttpStatus.CONFLICT,
        );
      }
    }

    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );

    return this.prisma.category.update({
      where: { id },
      data: {
        ...updateData,
        slug,
      },
    });
  }

  /**
   * Remove category
   */
  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Cannot delete category. It may be linked to products.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
