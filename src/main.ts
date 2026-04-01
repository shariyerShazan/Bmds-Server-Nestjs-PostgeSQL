/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

console.log('🚀 Main.ts loaded, starting bootstrap...');

async function bootstrap() {
  console.log('📍 Bootstrap function started');
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  console.log('📍 NestFactory app created');

  // app.use(
  //   express.json({
  //     limit: '50mb',
  //     verify: (req: any, res, buf) => {
  //       if (req.originalUrl.includes('/webhooks/stripe')) {
  //         req.rawBody = buf;
  //       }
  //     },
  //   }),
  // );

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 4. Cookie Parser
  app.use(cookieParser());

  // app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      whitelist: true,
      // Frontend theke extra field ashar risk thake, tai eita false kora safe
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  const config = new DocumentBuilder()
    .setTitle('BDMS API')
    .setDescription('The VIC_PEC API description')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('accessToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT) || 3000;
  console.log('📍 About to listen on port:', port);
  process.stdout.write('Starting server...\n');
  await app.listen(port);
  process.stdout.write(
    `✅ Server is running on: http://localhost:${port}/docs\n`,
  );
  console.log(`Server is running on: http://localhost:${port}/docs`);
}

console.log('🚀 Calling bootstrap...');
(async () => {
  try {
    await bootstrap();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
