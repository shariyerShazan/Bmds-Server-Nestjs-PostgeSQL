import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from 'generated/prisma/enums';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'iphone-15-pro' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'Latest flagship from Apple' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'A3106' })
  @IsString()
  @IsNotEmpty()
  model!: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  costPrice!: number;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  @Min(0)
  salePrice!: number;

  @ApiPropertyOptional({ example: 50 })
  @IsInt()
  @Min(0)
  @IsOptional()
  initStock?: number = 0;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString()
  @IsOptional()
  barCode?: string;

  @ApiProperty({ example: 'category_id_here' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus = ProductStatus.ACTIVE;

  @ApiPropertyOptional({ example: 'brand_id_here' })
  @IsString()
  @IsOptional()
  brandId?: string;
}

export class UpdateProductDto extends CreateProductDto {}
