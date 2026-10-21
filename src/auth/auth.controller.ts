import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { LoginDTO } from './DTO/Login.Dto';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { Roles } from './decorators/roles.decorators';
import { UserRole } from 'src/user/schemas/user.schema';
import { CreateUserDto } from '../user/DTO/CreateUser.Dto';
import { RolesGuard } from 'src/common-auth/guards/roles.guards';
import { JwtAuthGuard } from 'src/common-auth/guards/jwt-auth.guard';
import { OTPDto } from './DTO/OTP.dto';
import { ClientType } from './decorators/client.type.decorator';
import { sendAuthTokens } from 'src/utils/auth-response.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // -------------------------------Register--------------------------------------
  @Post('register')
  async registerNewUser(
    @Body() userDTO: CreateUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { message, tokens } = await this.authService.registerNewUser({
      ...userDTO,
      username: userDTO.username,
      email: userDTO.email,
    });
    return sendAuthTokens(req, res, tokens, {
      message,
      statusCode: HttpStatus.CREATED,
    });
  }

  // -------------------------------Verify user using OTP--------------------------------------

  @Post('verify-otp')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyOTP(@Body() body: OTPDto, @Req() req) {
    const { OTP } = body;
    const userId = req.user?.userId;
    if (!OTP && !userId)
      throw new UnauthorizedException("User didn't provided enough data");
    await this.authService.verfiyOTP(OTP, userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'user verified successfully, Now You can login to your account',
    };
  }

  @Get('resend-otp')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resendOTP(@Req() req) {
    const userID = req.user?.userId;
    if (!userID) throw new BadRequestException('Userid not provided');
    const msg = await this.authService.resendOTP(userID);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: msg,
    };
  }
  // -------------------------------Login--------------------------------------
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req,
    @Body() loginDTO: LoginDTO,
    @Res({ passthrough: true }) res: Response,
    @ClientType() clientType: string,
  ) {
    console.log("login Dto : ", loginDTO);
    const data = await this.authService.login(loginDTO);
    // return sendAuthTokens(
    //   req,
    //   res,
    //   { accessToken: data.accessToken, refreshToken: data.refreshToken },
    //   { message: data.message, user: data.user },
    // );
    res.cookie('access_token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 30 * 60 * 1000,
    });
    res.cookie('refresh_token', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });
    if (clientType === 'mobile') return data;
    else return data;
  }
  // -------------------------------all-users--------------------------------------
  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async allUsers() {
    return this.authService.allUsers();
  }
  // -------------------------------me--------------------------------------
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    const res = await this.authService.me(req?.user);
    return {
      statusCode: HttpStatus.OK,
      message: 'returned user',
      data: res,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @ClientType() clientType: string,
  ) {
    const refreshToken = req.cookies['refresh_token'] ?? req.body.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const { accessToken, newRefreshToken } =
      await this.authService.refresh(refreshToken);

    if (clientType === 'mobile') {
      return { accessToken, refreshToken: newRefreshToken };
    }
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000,
    });
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    return { statusCode: HttpStatus.OK, message: 'Tokens refreshed' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req, @Res({ passthrough: true }) res) {
    const userid = req?.user?.userId;
    if (!userid) throw new UnauthorizedException('userid not provided');
    await this.authService.logout(userid);
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return {
      statuscode: 'ok',
      message: 'Logout Successful',
    };
  }

  @Get('test')
  // @UseGuards(JwtAuthGuard)
  test(@Req() req: Request, @ClientType() clientType: string) {
    return { message: 'hello', statusCode: HttpStatus.OK };
  }
}
