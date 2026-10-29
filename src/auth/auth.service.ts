import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../user/DTO/CreateUser.Dto';
import { UserService } from '../user/user.service';
import { LoginDTO } from './DTO/Login.Dto';
import { JwtService } from '@nestjs/jwt';
import { UserDocument, UserRole } from 'src/user/schemas/user.schema';
import { EmailService } from '../email/email.service';
import OTPGenerator from 'src/utils/OTP-generator.util';
import { InjectModel } from '@nestjs/mongoose';
import { PasswordReset, PasswordResetDocument } from './schema/password-reset.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';



@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @InjectModel(PasswordReset.name) private readonly passwordResetModel: Model<PasswordResetDocument>
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
      throw new BadRequestException('Invalid credentials');
    }
    if (!(await this.verifyPassword(loginDTO.password, foundUser.password))) {
      throw new BadRequestException('Invalid credentials');
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

  async resetPassword(email: string, otp: string, newpassword: string) {
    const user = await this.userService.getUserByEmail(email);
    if (!user) throw new BadRequestException("Invalid user");
    const record = await this.passwordResetModel.findOne({ userId: user._id });
    if (!record || record.expiresAt < new Date() || record.attempts >= 5) throw new BadRequestException('Invalid request');
    if (!await bcrypt.compare(otp, record.otpHash)) {
      await this.passwordResetModel.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
      throw new BadRequestException("Please enter correct OTP");
    }
    user.password = await bcrypt.hash(newpassword, 10);
    await user.save();
    await this.passwordResetModel.deleteOne({ _id: record._id });
    return "Password reset successfully"
  };
  async forgetPassword(email: string) {
    const user = await this.userService.getUserByEmail(email);
    if (!user) throw new BadRequestException("Invalid user");
    const OTP = OTPGenerator().toString();
    const hashedOTP = await bcrypt.hash(OTP, 10);
    await this.passwordResetModel.findOneAndUpdate({ userId: user._id }, { otpHash: hashedOTP, expiresAt: new Date(Date.now() + 10 * 60 * 1000), attampts: 0 }, { upsert: true, returnDocument: "after" });
    await this.emailService.sendForgetPasswordOTP(email, OTP);
    const token = this.jwtService.sign({ sub: user._id, email: user.email, role: user.role }, { secret: process.env.JWT_SECRET, expiresIn: "5m" });
    return { message: "Recovery OTP sent successfully", token };
  };

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
