/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'generated/prisma/enums';
import { UpdateAdminDto } from './dto/admin.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';

@ApiTags('Admins')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all admins with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'searchTerm', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admins fetched successfully',
  })
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.adminService.findAll(query);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Admins found successfully',
      meta: result?.meta,
      data: result?.data,
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a single admin by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin found successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Admin not found' })
  async findOne(@Param('id') id: string) {
    const result = await this.adminService.findOne(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Admin found successfully',
      data: result,
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update admin profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    const result = await this.adminService.update(id, updateAdminDto);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Admin updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete admin account' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin deleted successfully',
  })
  async remove(@Param('id') id: string) {
    const result = await this.adminService.remove(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Admin deleted successfully',
      data: result,
    };
  }
}
