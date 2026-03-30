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
import { BrandService } from './brand.service';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'generated/prisma/enums';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@ApiTags('Brands')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Brand created successfully',
  })
  async create(@Body() createBrandDto: CreateBrandDto) {
    const result = await this.brandService.create(createBrandDto);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Brand created successfully',
      data: result,
    };
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get all brands with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'searchTerm', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brands fetched successfully',
  })
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.brandService.findAll(query);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Brands retrieved successfully',
      meta: result?.meta,
      data: result?.data,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get a single brand by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand found successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Brand not found' })
  async findOne(@Param('id') id: string) {
    const result = await this.brandService.findOne(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Brand retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Update brand details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    const result = await this.brandService.update(id, updateBrandDto);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Brand updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Delete a brand' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand deleted successfully',
  })
  async remove(@Param('id') id: string) {
    const result = await this.brandService.remove(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Brand deleted successfully',
      data: result,
    };
  }
}
