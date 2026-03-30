import {
  //   IsMongoId,
  IsInt,
  IsEnum,
  IsOptional,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus, StockType } from 'generated/prisma/enums';

export class CreateReportDto {
  @ApiProperty({ example: 'product_mongo_id' })
  //   @IsMongoId()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  qty!: number;

  @ApiPropertyOptional({ enum: StockType, default: StockType.IN })
  @IsEnum(StockType)
  @IsOptional()
  type?: StockType = StockType.IN;

  @ApiPropertyOptional({ enum: ReportStatus, default: ReportStatus.PENDING })
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus = ReportStatus.PENDING;
}

export class UpdateReportDto extends CreateReportDto {}
