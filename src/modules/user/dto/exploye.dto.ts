// import { BloodGroup, Gender, Lang, Role, Status } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodGroup, Gender, Lang, Role, Status } from 'generated/prisma/enums';

export class EmployeeDto {
  @ApiPropertyOptional({ example: 'Employee Name' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ enum: BloodGroup })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  address?: string = '';

  @ApiPropertyOptional({ example: 'Dhaka' })
  @IsOptional()
  @IsString()
  city?: string = '';

  @ApiPropertyOptional({ example: '1212' })
  @IsOptional()
  @IsString()
  zip?: string = '';

  @ApiPropertyOptional({ example: 'Dhaka State' })
  @IsOptional()
  @IsString()
  state?: string = '';

  @ApiPropertyOptional({ example: 'Bangladesh' })
  @IsOptional()
  @IsString()
  country?: string = '';
}

export class CreateEmployeeDto {
  @ApiProperty({ type: () => EmployeeDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EmployeeDto)
  employee: EmployeeDto;

  @ApiPropertyOptional({ example: 'employee_01' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'employee@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+8801800000000' })
  @IsOptional()
  @IsPhoneNumber()
  @IsNotEmpty()
  contactNo: string;

  @ApiProperty({ example: 'employee@example.com', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: Lang, default: Lang.ENG })
  @IsEnum(Lang)
  @IsOptional()
  lang?: Lang = Lang.ENG;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'Warehouse staff' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: Status, default: Status.ACTIVE })
  @IsEnum(Status)
  @IsOptional()
  status?: Status = Status.ACTIVE;

  @ApiPropertyOptional({ enum: Role, default: Role.EMPLOYEE })
  @IsEnum(Role)
  @IsOptional()
  role: Role = Role.EMPLOYEE;
}

export class ChangeStatusDto {
  @ApiProperty({ enum: Status, example: Status.ACTIVE })
  status: Status;
}
