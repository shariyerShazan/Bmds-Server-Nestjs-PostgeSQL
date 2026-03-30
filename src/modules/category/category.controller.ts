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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';

import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'generated/prisma/enums';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('Categories')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category created successfully',
  })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const result = await this.categoryService.create(createCategoryDto);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Category created successfully',
      data: result,
    };
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get all categories with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'searchTerm', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories fetched successfully',
  })
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.categoryService.findAll(query);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Categories retrieved successfully',
      meta: result?.meta,
      data: result?.data,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get a single category by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category found successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  async findOne(@Param('id') id: string) {
    const result = await this.categoryService.findOne(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Category retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Update category details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const result = await this.categoryService.update(id, updateCategoryDto);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Category updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category deleted successfully',
  })
  async remove(@Param('id') id: string) {
    const result = await this.categoryService.remove(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Category deleted successfully',
      data: result,
    };
  }
}
