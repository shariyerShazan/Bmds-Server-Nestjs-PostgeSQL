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
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'generated/prisma/enums';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { ProductService } from './products.service';

@ApiTags('Products')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully',
  })
  async create(@Req() req: any, @Body() createProductDto: CreateProductDto) {
    const user = req?.user;
    const result = await this.productService.create(user, createProductDto);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Product created successfully',
      data: result,
    };
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get all products with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'searchTerm', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'brandId', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products fetched successfully',
  })
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.productService.findAll(query);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Products retrieved successfully',
      meta: result?.meta,
      data: result?.data,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get a single product by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product found successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  async findOne(@Param('id') id: string) {
    const result = await this.productService.findOne(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Product retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Update product details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const result = await this.productService.update(id, updateProductDto);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Product updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product deleted successfully',
  })
  async remove(@Param('id') id: string) {
    const result = await this.productService.remove(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Product deleted successfully',
      data: result,
    };
  }
}
