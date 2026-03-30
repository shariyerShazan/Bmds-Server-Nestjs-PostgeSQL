import { Controller, Get, Query, HttpStatus, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'generated/prisma/enums';

export type FilterBy = 'week' | 'month' | 'year' | undefined;
@UseGuards(AuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAnalytics(@Query('filterBy') filterBy: FilterBy) {
    const result = await this.analyticsService.getDashboardAnalytics(filterBy);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Analytics fetched successfully',
      data: result,
    };
  }
}
