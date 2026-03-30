/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateAdminDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: Record<string, any>) {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc', 
      searchTerm, 
      email, 
      status 
    } = query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const queryCondition = {
      role: Role.ADMIN,
      AND: [
        searchTerm ? {
          OR: [
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { username: { contains: searchTerm, mode: 'insensitive' } },
            { admin: { fullName: { contains: searchTerm, mode: 'insensitive' } } }
          ]
        } : {},
        email ? { email } : {},
        status ? { status: status as any } : {},
      ]
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: queryCondition as any,
        include: { admin: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      this.prisma.user.count({ where: queryCondition as any })
    ]);

    const data = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      meta: {
        page: Number(page),
        limit: Number(limit),
        total
      },
      data
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        role: Role.ADMIN,
        OR: [
          { id: id },
          { admin: { id: id } }
        ]
      },
      include: { admin: true }
    });

    if (!user) {
      throw new HttpException('Admin Not Found', HttpStatus.NOT_FOUND);
    }

    const { password, ...result } = user;
    return result;
  }

  async update(id: string, data: UpdateAdminDto) {
    const { admin, ...userData } = data;
    const existingUser = await this.findOne(id) as any; // Cast as any to access .id safely

    return await this.prisma.$transaction(async (tx: any) => {
      if (userData.email) {
        // Use 'tx' instead of 'this.prisma'
        const isEmailExists = await tx.user.findUnique({
          where: { 
            email: userData.email, 
            NOT: { id: existingUser.id } 
          },
        });
        if (isEmailExists) {
          throw new HttpException('Email already exists', HttpStatus.CONFLICT);
        }
      }

      // Use 'tx' instead of 'this.prisma'
      const updatedUser = await tx.user.update({
        where: { id: existingUser.id },
        data: {
          ...userData,
          admin: admin ? {
            update: {
              ...admin
            }
          } : undefined
        },
        include: { admin: true }
      });

      const { password, ...result } = updatedUser;
      return result;
    });
  }

  async remove(id: string) {
    const existingUser = await this.findOne(id) as any; // Cast as any to access .id safely

    await this.prisma.$transaction(async (tx: any) => {
      // Use 'tx' instead of 'this.prisma'
      await tx.admin.delete({
        where: { userId: existingUser.id },
      });

      await tx.user.delete({
        where: { id: existingUser.id },
      });
    });

    return {
      message: 'Admin account deleted successfully'
    };
  }
}