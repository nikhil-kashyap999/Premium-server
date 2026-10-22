import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../user/DTO/CreateUser.Dto';
import { UserService } from '../user/user.service';
import { LoginDTO } from './DTO/Login.Dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/user/schemas/user.schema';
import { EmailService } from '../email/email.service';
import OTPGenerator from 'src/utils/OTP-generator.util';
import { sendAuthTokens } from 'src/utils/auth-response.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) { }

  async registerNewUser(userDto: CreateUserDto) {
    const { user, OTP } = await this.userService.createUser(userDto);
    await this.emailService.sendOTPEmail(userDto.email, OTP);
    const tokens = this.generateTokens(user._id, user.username, user.role);
    return { message: `OTP sent to ${userDto.email}`, tokens };
  }

  async resendOTP(userid: string) {
    const user = await this.userService.findById(userid);
    if (user.otpAttempts >= 5) {
      throw new BadRequestException(
        'Maximum attempt reach, Request for new OTP after some time later',
      );
    }
    const OTP = OTPGenerator();
    const hasedOTP = await bcrypt.hash(OTP, 10);
    await this.emailService.sendOTPEmail(user.email, OTP);
    user.verificationToken = hasedOTP;
    user.unverifiedExpiresAt = new Date();
    user.save();
    return `OTP resend to ${user.email}`
  }

  async verfiyOTP(OTP: string, userid: string) {
    await this.emailService.verifyOTP(OTP, userid);
  }

  async login(loginDTO: LoginDTO) {
    const foundUser = await this.userService.findByUsername(loginDTO.username);
    if (!foundUser) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!(await this.verifyPassword(loginDTO.password, foundUser.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!foundUser.isVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in',
      );
    }
    const user = await this.userService.markIsActive(foundUser);
    const tokens = this.generateTokens(user._id, user.username, user.role);
    const { password, ...restUser } = user;
    return {
      message: 'Logged in successful',
      user: restUser,
      ...tokens,
    };
  }
  async allUsers() {
    return this.userService.allUsers();
  }
  async me(user: any) {
    const res = await this.userService.me(user?.userId);
    return res;
  }
  async refresh(refreshToken: string) {
    let payload: { sub: string; username: string; role: UserRole };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invaild or expired resfresh token');
    }

    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(
      user._id,
      user.username,
      user.role,
    );

    return { accessToken, newRefreshToken };
  }
  async logout(userid: string) {
    const res = await this.userService.logout(userid);
    return res;
  }
  async socketToken(req) {
    return await this.jwtService.signAsync({ sub: req.user.userId, username: req.user.username, role: req.user.role, purpose: 'ws' }, { secret: process.env.JWT_SECRET, expiresIn: '2m' });
  }
  // -----------------------------Helper functions----------------------------------
  generateTokens(userID: any, username: string, role: UserRole) {
    const payload = { sub: userID, username, role };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    return { accessToken, refreshToken };
  }
  private generateAccessToken(payload: {
    sub: any;
    username: string;
    role: UserRole;
  }) {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '30m',
    });
    return accessToken;
  }
  private generateRefreshToken(payload: {
    sub: any;
    username: string;
    role: UserRole;
  }) {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });
  }
  private verifyRefreshToken(token: string) {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_REFRESH_SECRET,
    });
  }
  async verifyPassword(
    plainPassword: string,
    hasedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hasedPassword);
  }
}
