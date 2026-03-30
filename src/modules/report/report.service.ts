/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReportDto, UpdateReportDto } from './dto/report.dto';
import { ReportStatus, Role, StockType } from 'generated/prisma/enums';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: any, payload: CreateReportDto) {
    let employeeId: string | undefined;
    if (user.role === Role.EMPLOYEE) {
      const employeeUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { employee: true },
      });
      employeeId = employeeUser?.employee?.id;
    }

    return await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: payload.productId },
      });

      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      const totalCostPrice = payload.qty * product.costPrice;
      const totalSalePrice =
        payload.type === StockType.OUT ? payload.qty * product.salePrice : 0;
      const profitLoss =
        payload.type === StockType.OUT
          ? payload.qty * (product.salePrice - product.costPrice)
          : 0;

      const status =
        user.role === Role.ADMIN ? ReportStatus.APPROVED : ReportStatus.PENDING;

      if (status === ReportStatus.APPROVED) {
        await this.applyStockEffect(
          tx,
          product.id,
          payload.qty,
          payload.type as StockType,
        );
      }

      return await tx.report.create({
        data: {
          ...payload,
          totalCostPrice,
          totalSalePrice,
          profitLoss,
          status,
          createdBy: user.role,
          employeeId,
        },
      });
    });
  }

  async changeStatus(user: any, id: string, status: ReportStatus) {
    if (user.role !== Role.ADMIN) {
      throw new HttpException(
        'Only admin can approve/reject',
        HttpStatus.FORBIDDEN,
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({ where: { id } });
      if (!report)
        throw new HttpException('Report not found', HttpStatus.NOT_FOUND);

      if (report.status === status) return report;

      if (
        status === ReportStatus.APPROVED &&
        report.status !== ReportStatus.APPROVED
      ) {
        await this.applyStockEffect(
          tx,
          report.productId,
          report.qty,
          report.type,
        );
      } else if (
        status !== ReportStatus.APPROVED &&
        report.status === ReportStatus.APPROVED
      ) {
        await this.reverseStockEffect(
          tx,
          report.productId,
          report.qty,
          report.type,
        );
      }

      return await tx.report.update({
        where: { id },
        data: { status },
      });
    });
  }

  /**
   * Update Report with Re-calculation
   */
  async update(id: string, payload: UpdateReportDto) {
    return await this.prisma.$transaction(async (tx) => {
      const existing = await tx.report.findUnique({ where: { id } });
      if (!existing)
        throw new HttpException('Report not found', HttpStatus.NOT_FOUND);

      if (existing.status === ReportStatus.APPROVED) {
        await this.reverseStockEffect(
          tx,
          existing.productId,
          existing.qty,
          existing.type,
        );
      }

      const product = await tx.product.findUnique({
        where: { id: payload.productId || existing.productId },
      });

      if (!product)
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);

      const qty = payload.qty ?? existing.qty;
      const type = payload.type ?? existing.type;

      const totalCostPrice = qty * product.costPrice;
      const totalSalePrice =
        type === StockType.OUT ? qty * product.salePrice : 0;
      const profitLoss =
        type === StockType.OUT
          ? qty * (product.salePrice - product.costPrice)
          : 0;

      const updatedReport = await tx.report.update({
        where: { id },
        data: { ...payload, totalCostPrice, totalSalePrice, profitLoss },
      });

      if (existing.status === ReportStatus.APPROVED) {
        await this.applyStockEffect(tx, product.id, qty, type);
      }

      return updatedReport;
    });
  }

  private async applyStockEffect(
    tx: any,
    productId: string,
    qty: number,
    type: StockType,
  ) {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (type === StockType.OUT && product.initStock < qty) {
      throw new HttpException('Insufficient stock', HttpStatus.BAD_REQUEST);
    }

    await tx.product.update({
      where: { id: productId },
      data: {
        initStock:
          type === StockType.IN ? { increment: qty } : { decrement: qty },
      },
    });
  }

  /**
   * Helper: Reverse Stock
   */
  private async reverseStockEffect(
    tx: any,
    productId: string,
    qty: number,
    type: StockType,
  ) {
    await tx.product.update({
      where: { id: productId },
      data: {
        initStock:
          type === StockType.IN ? { decrement: qty } : { increment: qty },
      },
    });
  }

  /**
   * Find All with Pagination
   */
  async findAll(query: Record<string, any>) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      type,
      productId,
    } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      AND: [
        status ? { status } : {},
        type ? { type } : {},
        productId ? { productId } : {},
      ],
    };

    const [result, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: { product: true, employee: { include: { user: true } } },
      }),
      this.prisma.report.count({ where }),
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

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { product: true, employee: true },
    });
    if (!report)
      throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
    return report;
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    return await this.prisma.$transaction(async (tx) => {
      if (existing.status === ReportStatus.APPROVED) {
        await this.reverseStockEffect(
          tx,
          existing.productId,
          existing.qty,
          existing.type,
        );
      }
      return await tx.report.delete({ where: { id } });
    });
  }
}
