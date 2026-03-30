import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UsersController } from './user.controller';
import { PrismaService } from 'src/prisma/prisma.service';
// import { UserController } from './user.controller';

@Module({
  providers: [UserService, PrismaService],
  controllers: [UsersController],
})
export class UserModule {}
