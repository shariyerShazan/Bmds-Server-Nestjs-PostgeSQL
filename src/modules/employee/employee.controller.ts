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
import { EmployeeService } from './employee.service';
// import { UpdateEmployeeDto } from './dto/employee.dto';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'generated/prisma/enums';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { UpdateEmployeeDto } from './dto/employe.dto';

@ApiTags('Employees')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get all employees with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'searchTerm', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employees fetched successfully',
  })
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.employeeService.findAll(query);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employees found successfully',
      meta: result?.meta,
      data: result?.data,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get a single employee by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee found successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Employee not found',
  })
  async findOne(@Param('id') id: string) {
    const result = await this.employeeService.findOne(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee found successfully',
      data: result,
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Update employee profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    // ইন্টারসেপ্টর বাদ দেওয়ায় এখন সরাসরি বডি থেকে ডাটা যাবে
    const result = await this.employeeService.update(id, updateEmployeeDto);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Delete employee account' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee deleted successfully',
  })
  async remove(@Param('id') id: string) {
    const result = await this.employeeService.remove(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee deleted successfully',
      data: result,
    };
  }
}
