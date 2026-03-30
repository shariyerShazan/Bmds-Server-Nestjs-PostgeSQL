import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  //   IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, Status } from 'generated/prisma/enums';

export class EmployeeDetailsDto {
  @ApiPropertyOptional({ example: 'Senior Developer' })
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsString()
  @IsOptional()
  joiningDate?: string;

  @ApiPropertyOptional({ example: '50000' })
  @IsString()
  @IsOptional()
  salary?: string;
}

/**
 * মেইন আপডেট ডিটিও (User + Employee)
 */
export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+8801700000000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ enum: Status, example: Status.ACTIVE })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @ApiPropertyOptional({ type: EmployeeDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmployeeDetailsDto)
  employee?: EmployeeDetailsDto;
}
