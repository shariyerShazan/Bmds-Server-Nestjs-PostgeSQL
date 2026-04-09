/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import {
  BrandStatus,
  ProductStatus,
  ReportStatus,
} from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  getDaysInMonth,
} from 'date-fns';

export type FilterBy = 'week' | 'month' | 'year' | undefined;

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardAnalytics(filterBy: FilterBy = 'week') {
    const now = new Date();
    let range: { gte: Date; lte: Date };

    switch (filterBy) {
      case 'month':
        range = { gte: startOfMonth(now), lte: endOfMonth(now) };
        break;
      case 'year':
        range = { gte: startOfYear(now), lte: endOfYear(now) };
        break;
      default: // week
        range = {
          gte: startOfWeek(now, { weekStartsOn: 1 }),
          lte: endOfWeek(now, { weekStartsOn: 1 }),
        };
    }

    const [
      totalCategories,
      totalBrands,
      totalProducts,
      totalReports,
      reportsForChart,
      incomeSummary,
    ] = await this.prisma.$transaction([
      this.prisma.category.count({ where: { status: ProductStatus.ACTIVE } }),
      this.prisma.brand.count({ where: { status: BrandStatus.ACTIVE } }),
      this.prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      this.prisma.report.count({ where: { status: ReportStatus.APPROVED } }),
      this.prisma.report.findMany({
        where: {
          createdAt: { gte: range.gte, lte: range.lte },
          status: ReportStatus.APPROVED,
        },
      }),
      this.prisma.report.aggregate({
        where: { status: ReportStatus.APPROVED },
        _sum: { totalSalePrice: true, totalCostPrice: true },
      }),
    ]);

    const map = new Map<string, { count: number; value: number }>();

    reportsForChart.forEach((item) => {
      let label: string;
      if (filterBy === 'month') label = format(item.createdAt, 'd');
      else if (filterBy === 'year') label = format(item.createdAt, 'MMM');
      else label = format(item.createdAt, 'EEE');

      if (!map.has(label)) map.set(label, { count: 0, value: 0 });
      const val = map.get(label)!;
      val.count += 1;
      val.value += Number(item.totalSalePrice || 0);
    });

    const order =
      filterBy === 'year'
        ? [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ]
        : filterBy === 'month'
          ? Array.from({ length: getDaysInMonth(now) }, (_, i) => String(i + 1))
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const chartData = order.map((label) => ({
      label,
      count: map.get(label)?.count || 0,
      value: map.get(label)?.value || 0,
    }));

    return {
      totalCategories,
      totalBrands,
      totalProducts,
      totalReports,
      totalRevenue: incomeSummary._sum.totalSalePrice || 0,
      totalCost: incomeSummary._sum.totalCostPrice || 0,
      profit:
        (incomeSummary._sum.totalSalePrice || 0) -
        (incomeSummary._sum.totalCostPrice || 0),
      chartData,
    };
  }
}
