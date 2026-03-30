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
import { Lang, Role, Status } from 'generated/prisma/enums';

export class CreateAdminDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiPropertyOptional({ example: 'Dhaka, Bangladesh' })
  @IsOptional()
  @IsString()
  address?: string;

  //   @ApiPropertyOptional({
  //     example: 'Full Stack Developer with 1 year experience',
  //   })
  //   @IsOptional()
  //   @IsString()
  //   intro?: string;
}

export class CreateUserAdminDto {
  @ApiPropertyOptional({ example: 'admin_user' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ example: '+8801700000000' })
  @IsOptional()
  @IsPhoneNumber()
  @IsNotEmpty()
  contactNo!: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: Lang, default: Lang.ENG })
  @IsEnum(Lang)
  @IsOptional()
  lang?: Lang = Lang.ENG;

  @ApiPropertyOptional({ enum: Role, default: Role.ADMIN })
  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.ADMIN;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'Super admin of the system' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: Status, default: Status.ACTIVE })
  @IsEnum(Status)
  @IsOptional()
  status?: Status = Status.ACTIVE;

  @ApiPropertyOptional({ type: () => CreateAdminDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAdminDto)
  admin?: CreateAdminDto;
}
