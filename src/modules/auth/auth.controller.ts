/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/decorators/role.decorator';
// import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from 'generated/prisma/enums';
import type { Request, Response } from 'express';
// import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/guards/roles.guard';
import { AuthGuard } from 'src/guards/auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User Login' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User login successful' })
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    res.cookie('accessToken', result.access_token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
        secure: true,  
      sameSite: 'none',
      path: '/',
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User login successfully',
      data: result,
    };
  }

  @Post('fcm-token')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Set device FCM token' })
  async setFCMToken(
    @Req() req: Request,
    @Body() tokenDto: { deviceToken: string },
  ) {
    const result = await this.authService.setFCMToken(req, tokenDto);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'FCM token set successfully',
      data: result,
    };
  }

  @Get('get-me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: Request) {
    const user: any = req?.user;
    const result = await this.authService.getMe(user?.id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User profile found successfully',
      data: result,
    };
  }

  @Post('change-password')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(
    @Body() data: { prevPass: string; newPass: string },
    @Req() req: Request,
  ) {
    const user: any = req?.user;
    const result = await this.authService.changePassword(
      user?.id,
      data.prevPass,
      data.newPass,
    );

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Password changed successfully',
      data: result,
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Send reset password email' })
  async forgotPassword(@Body() data: { email: string }) {
    const result = await this.authService.forgetPassword(data?.email);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Forget password mail sent successfully',
      data: result,
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  async resetPassword(
    @Headers('authorization') token: string,
    @Body() payload: { id: string; newPass: string },
  ) {
    const result = await this.authService.resetPassword(token, payload.newPass);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Password reset successfully',
      data: result,
    };
  }

  @Post('change-email')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Request email change verification' })
  async requestEmailChange(
    @Req() req: Request,
    @Body() body: { newEmail: string; password: string },
  ) {
    const user: any = req.user;
    const result = await this.authService.requestEmailChange(
      user.id,
      body.newEmail,
      body.password,
    );

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Verification mail sent successfully',
      data: result,
    };
  }

  @Post('reset-email')
  @ApiOperation({ summary: 'Confirm email change using token' })
  async confirmEmailChange(@Headers('authorization') token: string) {
    const result = await this.authService.confirmEmailChange(token);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Email changed successfully',
      data: result,
    };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const user = req.user;
    await this.authService.logout(user.id);

   res.clearCookie("accessToken", {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/",
});
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
