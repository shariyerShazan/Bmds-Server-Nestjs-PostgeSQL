/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
// import { Role, Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { CreateUserAdminDto } from './dto/admin.dto';
import { CreateEmployeeDto } from './dto/exploye.dto';
import { Role, Status } from 'generated/prisma/enums';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createAdmin(payload: CreateUserAdminDto) {
    const {
      admin: adminData,
      description,
      lang,
      avatar,
      ...userData
    } = payload;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          userData.username ? { username: userData.username } : null,
        ].filter(Boolean) as any,
      },
    });

    if (existingUser) {
      throw new HttpException(
        existingUser.email === userData.email
          ? 'Email already in use'
          : 'Username already in use',
        HttpStatus.CONFLICT,
      );
    }

    const plainPassword =
      userData.password ||
      this.configService.get('DEFAULT_ADMIN_PASSWORD') ||
      'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const result = await this.prisma.$transaction(async (tx) => {
      // ২. এখন userData এর ভেতর শুধু email, username, password, contactNo এগুলো আছে
      const user = await tx.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          contactNo: userData.contactNo,
          password: hashedPassword,
          role: Role.ADMIN,
          status: Status.ACTIVE,
          // এখানে lang বা avatar দিবেন না যদি User মডেলে না থাকে
        },
      });

      await tx.admin.create({
        data: {
          fullName: adminData?.fullName || 'Admin User',
          address: adminData?.address || null,
          userId: user.id,
        },
      });

      return user;
    });

    return await this.prisma.user.findUnique({
      where: { id: result.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        admin: true,
      },
    });
  }

  async createEmployee(payload: CreateEmployeeDto) {
    const { employee: employeeData, ...userData } = payload;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          userData.username ? { username: userData.username } : null,
        ].filter(Boolean) as any,
      },
    });

    if (existingUser) {
      throw new HttpException(
        'User with this email or username already exists',
        HttpStatus.CONFLICT,
      );
    }

    const plainPassword =
      userData.password ||
      this.configService.get('DEFAULT_PASSWORD') ||
      'employee123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          contactNo: userData.contactNo,
          password: hashedPassword,
          role: Role.EMPLOYEE,
          status: Status.ACTIVE,
        },
      });

      await tx.employee.create({
        data: {
          ...employeeData,
          userId: user.id,
        },
      });

      return user;
    });

    return await this.prisma.user.findUnique({
      where: { id: result.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        employee: true,
      },
    });
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
          createdAt: true,
          admin: true,
          employee: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
      data,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id }, { email: id }, { username: id }],
      } as any,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        admin: true,
        employee: true,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async changeStatus(id: string, status: Status) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return await this.prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return await this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
      },
    });
  }
}
