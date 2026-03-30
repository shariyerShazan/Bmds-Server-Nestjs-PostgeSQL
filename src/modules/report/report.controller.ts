/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportService } from './report.service';
import { CreateReportDto, UpdateReportDto } from './dto/report.dto';
import { Roles } from 'src/decorators/role.decorator';
import { Role, ReportStatus } from 'generated/prisma/enums';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';

@ApiTags('Reports')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Create a new stock report' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Report created successfully',
  })
  async create(@Req() req: any, @Body() createReportDto: CreateReportDto) {
    const user = req?.user;
    const result = await this.reportService.create(user, createReportDto);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Report created successfully',
      data: result,
    };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get all reports with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ReportStatus })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reports fetched successfully',
  })
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.reportService.findAll(query);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Reports retrieved successfully',
      meta: result?.meta,
      data: result?.data,
    };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get a single report by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report found successfully',
  })
  async findOne(@Param('id') id: string) {
    const result = await this.reportService.findOne(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Report retrieved successfully',
      data: result,
    };
  }

  @Patch('change-status/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Approve or Reject a report (Admin Only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report status updated successfully',
  })
  async changeStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() payload: { status: ReportStatus },
  ) {
    const user = req?.user;
    const result = await this.reportService.changeStatus(user, id, payload.status);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `Report ${payload.status.toLowerCase()} successfully`,
      data: result,
    };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Update report details' })
  async update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
  ) {
    const result = await this.reportService.update(id, updateReportDto);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Report updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Delete a report' })
  async remove(@Param('id') id: string) {
    const result = await this.reportService.remove(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Report deleted successfully',
      data: result,
    };
  }
}