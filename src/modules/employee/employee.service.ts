/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'generated/prisma/enums';
import { UpdateEmployeeDto } from './dto/employe.dto';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all employees with filtering and pagination
   */
  async findAll(query: Record<string, any>) {
    const {
      page = 1,
      limit = 10,
      searchTerm,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const whereCondition: any = {
      role: Role.EMPLOYEE,
      AND: [
        searchTerm
          ? {
              OR: [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
              ],
            }
          : {},
        status ? { status } : {},
      ],
    };

    const [result, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereCondition,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: { employee: true },
        omit: { password: true } as any, // প্রিজমা ভার্সন অনুযায়ী omit কাজ করবে
      }),
      this.prisma.user.count({ where: whereCondition }),
    ]);

    return {
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPage: Math.ceil(total / take),
      },
      data: result,
    };
  }

  /**
   * Get a single employee by ID (User ID or Employee ID)
   */
  async findOne(id: string) {
    // প্রথমে চেক করছি আইডিটি সরাসরি এমপ্লয়ি টেবিলের কিনা অথবা ইউজার টেবিলের কিনা
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: id }, { employee: { id: id } }],
        role: Role.EMPLOYEE,
      },
      include: { employee: true },
      omit: { password: true } as any,
    });

    if (!user) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  /**
   * Update employee and user details using transaction
   */
  async update(id: string, data: UpdateEmployeeDto, avatar?: string) {
    const { employee, ...userData } = data;
    const existingUser = await this.findOne(id);

    return await this.prisma.$transaction(
      async (tx) => {
        if (userData.email) {
          const isEmailExists = await tx.user.findUnique({
            where: { email: userData.email, NOT: { id: existingUser.id } },
          });

          if (isEmailExists) {
            throw new HttpException(
              'Email already in use',
              HttpStatus.CONFLICT,
            );
          }
        }

        // ১. ইউজার টেবিল আপডেট
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            ...userData,
            ...(avatar ? { avatar } : {}),
          },
        });

        // ২. এমপ্লয়ি টেবিল আপডেট (যদি এমপ্লয়ি ডাটা থাকে)
        if (employee) {
          await tx.employee.update({
            where: { id: existingUser.employee?.id },
            data: { ...(employee as any) },
          });
        }

        // আপডেটেড ডাটা রিটার্ন
        return await tx.user.findUnique({
          where: { id: existingUser.id },
          include: { employee: true },
          omit: { password: true } as any,
        });
      },
      {
        timeout: 10000,
      },
    );
  }

  /**
   * Remove employee and associated user record
   */
  async remove(id: string) {
    const existingUser = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      // আগে চাইল্ড (Employee) ডিলিট করতে হবে, তারপর প্যারেন্ট (User)
      if (existingUser.employee?.id) {
        await tx.employee.delete({
          where: { id: existingUser.employee.id },
        });
      }

      await tx.user.delete({
        where: { id: existingUser.id },
      });
    });

    return { message: 'Employee deleted successfully' };
  }
}
