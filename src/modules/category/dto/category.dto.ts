import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CategoryStatus } from 'generated/prisma/enums';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics', description: 'Name of the category' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'electronics-gadgets',
    description: 'Unique slug',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    example: 'All types of electronic devices',
    description: 'Description',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ enum: CategoryStatus, default: CategoryStatus.ACTIVE })
  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus = CategoryStatus.ACTIVE;
}

export class UpdateCategoryDto extends CreateCategoryDto {}
