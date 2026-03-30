import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { Role } from 'generated/prisma/enums';

export class AdminDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'Dhaka, Bangladesh' })
  @IsString()
  location: string;
}

export class CreateAdminDto {
  @ApiProperty({ type: AdminDto })
  @ValidateNested()
  @Type(() => AdminDto)
  admin: AdminDto;

  @ApiProperty({ example: 'admin@mail.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'password123' })
  @IsOptional()
  @IsString()
  password: string;

  @ApiProperty({ example: '01700000000' })
  @IsString()
  contactNo: string;

  @ApiProperty({ enum: Role, default: Role.ADMIN })
  @IsEnum(Role)
  role: Role;
}

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}
