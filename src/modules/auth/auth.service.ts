/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, Injectable, HttpException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { Status } from 'generated/prisma/enums';
import { Request } from 'express';

@Injectable()
export class AuthService {
  //   private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly gmailService: MailService,
  ) {}

  async login(data: LoginDto) {
    const { email, password, deviceToken } = data;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { admin: true, employee: true },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    if (user.status !== Status.ACTIVE) {
      throw new HttpException(
        `Account is ${user.status}`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (deviceToken) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { fcmToken: deviceToken },
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const secret = this.configService.get('JWT_SECRET');

    return {
      access_token: await this.jwtService.signAsync(payload, {
        secret,
        expiresIn: '1d',
      }),
      refresh_token: await this.jwtService.signAsync(payload, {
        secret,
        expiresIn: '7d',
      }),
    };
  }

  // এই মেথডটি আপনার কন্ট্রোলারে মিসিং ছিল
  async setFCMToken(req: Request, data: { deviceToken: string }) {
    const user: any = req.user; // Request type error bypass
    const { deviceToken } = data;

    if (!user?.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { fcmToken: deviceToken },
    });

    return {
      message: 'FCM Token updated successfully',
      fcmToken: updatedUser.fcmToken,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        admin: true,
        employee: true,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const { password, ...result } = user;
    return result;
  }

  async changePassword(userId: string, prevPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const isMatched = await bcrypt.compare(prevPass, user.password);
    if (!isMatched) {
      throw new HttpException(
        'Previous password incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const hashPassword = await bcrypt.hash(newPass, this.saltRounds);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async forgetPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const token = await this.jwtService.signAsync(
      { id: user.id, email: user.email },
      { secret: this.configService.get('JWT_SECRET'), expiresIn: '15m' },
    );

    const resetLink = `${this.configService.get('CLIENT_URL')}/reset-password?token=${token}`;

    await this.gmailService.sendEmail({
      to: user.email,
      subject: 'Reset Your Password',
      html: `<p>Hello ${user.username || 'User'},</p>
             <p>Click <a href="${resetLink}">here</a> to reset your password. Valid for 15 mins.</p>`,
    });

    return { message: 'Reset link sent to email' };
  }

  async resetPassword(token: string, newPass: string) {
    let decoded: any;
    try {
      decoded = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch (e) {
      console.log(e);
      throw new HttpException('Invalid or expired token', HttpStatus.FORBIDDEN);
    }

    const hashPassword = await bcrypt.hash(newPass, this.saltRounds);
    await this.prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashPassword },
    });

    return { message: 'Password reset successful' };
  }

  async requestEmailChange(userId: string, newEmail: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const isPassOk = await bcrypt.compare(pass, user.password);
    if (!isPassOk)
      throw new HttpException('Password incorrect', HttpStatus.UNAUTHORIZED);

    const emailTaken = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });
    if (emailTaken)
      throw new HttpException('Email already in use', HttpStatus.BAD_REQUEST);

    const token = await this.jwtService.signAsync(
      { id: userId, newEmail },
      { secret: this.configService.get('JWT_SECRET'), expiresIn: '15m' },
    );

    const verifyLink = `${this.configService.get('CLIENT_URL')}/verify-email?token=${token}`;

    await this.gmailService.sendEmail({
      to: newEmail,
      subject: 'Confirm Email Change',
      html: `<p>Click <a href="${verifyLink}">here</a> to confirm your new email.</p>`,
    });

    return { message: 'Verification link sent to new email' };
  }

  async confirmEmailChange(token: string) {
    let decoded: any;
    try {
      decoded = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch (e) {
      console.log(e);
      throw new HttpException('Invalid token', HttpStatus.FORBIDDEN);
    }

    const emailExists = await this.prisma.user.findUnique({
      where: { email: decoded.newEmail },
    });
    if (emailExists)
      throw new HttpException('Email already taken', HttpStatus.BAD_REQUEST);

    await this.prisma.user.update({
      where: { id: decoded.id },
      data: { email: decoded.newEmail },
    });

    return { message: 'Email updated successfully' };
  }
}
