/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@Injectable()
export class BrandService {
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
   * Create a new brand
   */
  async create(data: CreateBrandDto) {
    const slug = data.slug || this.generateSlug(data.name);

    const isExists = await this.prisma.brand.findFirst({
      where: { slug },
    });

    if (isExists) {
      throw new HttpException(
        'Brand with this name or slug already exists',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.brand.create({
      data: {
        ...data,
        slug,
      },
    });
  }

  /**
   * Get all brands with simple Prisma filtering and pagination
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
      this.prisma.brand.findMany({
        where: whereCondition,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.brand.count({ where: whereCondition }),
    ]);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Brands fetched successfully',
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
   * Get a single brand by ID
   */
  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      throw new HttpException('Brand not found', HttpStatus.NOT_FOUND);
    }

    return brand;
  }

  /**
   * Update a brand
   */
  async update(id: string, data: UpdateBrandDto) {
    const existingBrand = await this.findOne(id);

    let slug = existingBrand.slug;
    if (data.name && data.name !== existingBrand.name) {
      slug = this.generateSlug(data.name);

      const slugCheck = await this.prisma.brand.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (slugCheck) {
        throw new HttpException(
          'Another brand already has this name',
          HttpStatus.CONFLICT,
        );
      }
    }

    // Undefined ভ্যালুগুলো বাদ দেওয়া
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );

    return this.prisma.brand.update({
      where: { id },
      data: {
        ...updateData,
        slug,
      },
    });
  }

  /**
   * Delete a brand
   */
  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.brand.delete({
        where: { id },
      });
    } catch (error) {
      throw new HttpException(
        'Cannot delete brand. It might be in use.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
