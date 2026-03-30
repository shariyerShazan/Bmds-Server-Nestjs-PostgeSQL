import { Module } from '@nestjs/common';
// import { ProductsService } from './products.service';
// import { ProductsController } from './products.controller';
import { ProductService } from './products.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductController } from './products.controller';

@Module({
  providers: [ProductService, PrismaService],
  controllers: [ProductController],
})
export class ProductsModule {}
