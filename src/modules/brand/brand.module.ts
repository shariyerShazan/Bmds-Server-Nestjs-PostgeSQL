import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [BrandService, PrismaService],
  controllers: [BrandController],
})
export class BrandModule {}
