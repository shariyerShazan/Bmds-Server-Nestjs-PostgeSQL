import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CreateEmployeeDto } from './dto/exploye.dto';
import { UserService } from './user.service';
import { CreateUserAdminDto } from './dto/admin.dto';
import { Role, Status } from 'generated/prisma/enums';
import { Roles } from 'src/decorators/role.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Post('create-admin')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new Admin user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Admin created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email or Username already in use',
  })
  async createAdmin(@Body() createAdminDto: CreateUserAdminDto) {
    const result = await this.usersService.createAdmin(createAdminDto);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Admin created successfully',
      data: result,
    };
  }

  @Post('create-employee')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new Employee user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Employee created successfully',
  })
  async createEmployee(@Body() createEmployeeDto: CreateEmployeeDto) {
    const result = await this.usersService.createEmployee(createEmployeeDto);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Employee created successfully',
      data: result,
    };
  }

  @Get('/')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: Status })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
  })
  async getUsers(@Query() query: any) {
    const result = await this.usersService.findAll(query);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a single user by ID, Email or Username' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const result = await this.usersService.findOne(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: result,
    };
  }

  @Patch('status/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change user status' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(Status),
          example: Status.ACTIVE,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User status updated successfully',
  })
  async changeStatus(
    @Param('id') id: string,
    @Body() data: { status: Status },
  ) {
    const result = await this.usersService.changeStatus(id, data?.status);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User status updated successfully',
      data: result,
    };
  }
}
