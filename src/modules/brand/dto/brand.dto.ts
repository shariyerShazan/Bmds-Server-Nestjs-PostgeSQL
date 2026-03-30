import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BrandStatus } from 'generated/prisma/enums';

export class CreateBrandDto {
  @ApiProperty({ example: 'Apple', description: 'The name of the brand' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'apple-brand',
    description: 'Unique slug for the brand',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    example: 'Tech giant known for iPhones',
    description: 'Brand details',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ enum: BrandStatus, default: BrandStatus.ACTIVE })
  @IsEnum(BrandStatus)
  @IsOptional()
  status?: BrandStatus = BrandStatus.ACTIVE;
}

export class UpdateBrandDto extends CreateBrandDto {}
