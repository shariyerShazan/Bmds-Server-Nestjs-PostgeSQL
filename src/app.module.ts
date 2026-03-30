import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { SeedService } from './seeds/seed.service';
import { MailModule } from './mail/mail.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { BrandModule } from './modules/brand/brand.module';
import { CategoryModule } from './modules/category/category.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { ProductsModule } from './modules/products/products.module';
import { ReportModule } from './modules/report/report.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'super-secret',
      signOptions: { expiresIn: '7d' },
    }),
    PrismaModule,
    MailModule,
    AdminModule,
    AuthModule,
    BrandModule,
    CategoryModule,
    EmployeeModule,
    ProductsModule,
    ReportModule,
    AnalyticsModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, SeedService],
})
export class AppModule {}
