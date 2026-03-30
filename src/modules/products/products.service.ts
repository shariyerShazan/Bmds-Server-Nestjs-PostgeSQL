/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/product.dto';
import { UpdateProductDto } from './dto/product.dto';
import { ReportStatus, Role, StockType } from 'generated/prisma/enums';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  async create(user: any, payload: CreateProductDto) {
    // 1. Validate if Category and Brand exist to avoid P2003 error
    const [category, brand] = await Promise.all([
      this.prisma.category.findUnique({ where: { id: payload.categoryId } }),
      payload.brandId
        ? this.prisma.brand.findUnique({ where: { id: payload.brandId } })
        : null,
    ]);

    if (!category) {
      throw new HttpException(
        `Category with ID ${payload.categoryId} not found`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (payload.brandId && !brand) {
      throw new HttpException(
        `Brand with ID ${payload.brandId} not found`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const slug = payload.slug || this.generateSlug(payload.name);
    const initStock = payload.initStock || 0;

    let employeeId: string | undefined;

    if (user.role === Role.EMPLOYEE) {
      const employeeUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { employee: true },
      });
      employeeId = employeeUser?.employee?.id;
    }

    return await this.prisma.$transaction(async (tx) => {
      // 2. Create the Product with 0 initial stock (Stock will be added via Report)
      const product = await tx.product.create({
        data: {
          ...payload,
          slug,
          initStock: 0,
        },
      });

      const totalCostPrice = initStock * payload.costPrice;
      const status =
        user.role === Role.ADMIN ? ReportStatus.APPROVED : ReportStatus.PENDING;

      // 3. Create the Stock Report
      await tx.report.create({
        data: {
          productId: product.id,
          qty: initStock,
          type: StockType.IN,
          totalCostPrice,
          totalSalePrice: 0,
          profitLoss: 0,
          status,
          createdBy: user.role,
          employeeId,
        },
      });

      // 4. If Admin created it, update the product stock immediately
      if (status === ReportStatus.APPROVED && initStock > 0) {
        return await tx.product.update({
          where: { id: product.id },
          data: { initStock: initStock },
        });
      }

      return product;
    });
  }

  async findAll(query: Record<string, any>) {
    const {
      page = 1,
      limit = 10,
      searchTerm,
      categoryId,
      brandId,
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
                { model: { contains: searchTerm, mode: 'insensitive' } },
                { barCode: { contains: searchTerm, mode: 'insensitive' } },
              ],
            }
          : {},
        categoryId ? { categoryId } : {},
        brandId ? { brandId } : {},
        status ? { status } : {},
      ],
    };

    const [result, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereCondition,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: { category: true, brand: true },
      }),
      this.prisma.product.count({ where: whereCondition }),
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
   * Find One Product
   */
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, brand: true },
    });

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return product;
  }

  async update(id: string, payload: UpdateProductDto) {
    const existingProduct = await this.findOne(id);

    let slug = existingProduct.slug;
    if (payload.name && payload.name !== existingProduct.name) {
      slug = this.generateSlug(payload.name);
    }

    return await this.prisma.product.update({
      where: { id },
      data: { ...payload, slug },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return await this.prisma.product.delete({
      where: { id },
    });
  }
}
