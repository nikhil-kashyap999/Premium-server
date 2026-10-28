import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private client: BrevoClient;
  private fromName: string;
  private fromEmail: string | undefined;

  constructor(
    private readonly configServie: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    this.client = new BrevoClient({
      apiKey: this.configServie.get<string>('BREVO_API_KEY') ?? '',
    });

    this.fromEmail = this.configServie.get<string>('EMAIL_FROM');
    this.fromName =
      this.configServie.get<string>('BREVO_SENDER_NAME') ?? 'sendme';
  }

  async sendOTPEmail(to: string, otp: string) {
    try {
      const result = await this.client.transactionalEmails.sendTransacEmail({
        sender: { email: this.fromEmail, name: this.fromName },
        to: [{ email: to }],
        subject: 'Your PREMIUM verification code',
        htmlContent: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a2c1c;">Verify your email</h2>
        <p>This is your verification code — vlaid for 10 minute:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3d5c3f; padding: 16px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px;">If you didn't request for this, then ignore this email.</p>
      </div>
    `,
      });
      this.logger.log(
        `OTP email sent to ${to} (messageId: ${result.messageId})`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to send OTP email to ${to}`, error);
      if (error.statusCode === 400) {
        throw new BadRequestException('Bad request, Failed to send OTP');
      }
      throw new Error('Failed to sent OTP');
    }
  }
  async verifyOTP(OTP: string, userid: string): Promise<string | undefined> {
    let isOTPValid: boolean = false;
    const user = await this.userModel.findById(userid);
    if (!user) {
      throw new NotFoundException(
        'Your OTP time period is over, please register yourself again',
      );
    }
    if (user.isVerified) {
      throw new ConflictException('Please Login to your account');
    }
    if (user && user.verificationToken) {
      isOTPValid = await this.verifyOTPHash(OTP, user.verificationToken);
    }

    if (user.otpAttempts < 5 && !isOTPValid) {
      user.otpAttempts = user.otpAttempts + 1;
      await user.save();
      throw new BadRequestException('Incorrect OTP');
    }
    if (user.verificationToken !== OTP && user.otpAttempts >= 5) {
      throw new BadRequestException(
        'Maximum attempt reach, Request for new OTP after some time later',
      );
    }
    if (isOTPValid && user.otpAttempts < 5) {
      user.isVerified = true;
      user.verificationToken = undefined;
      user.unverifiedExpiresAt = undefined;
      user.otpAttempts = 0;
      user.save();
    }
    return 'user verified sucessfully, Pleae login to your account';
  }
  async sendForgetPasswordOTP(to: string, OTP: string) {
    try {
      const result = await this.client.transactionalEmails.sendTransacEmail({
        sender: { email: this.fromEmail, name: this.fromName },
        to: [{ email: to }],
        subject: 'Your PREMIUM Password Recovery code',
        htmlContent: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a2c1c;">Password recovery OTP</h2>
        <p>This is your Password recovery code — vlaid for 10 minute:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3d5c3f; padding: 16px 0;">
          ${OTP}
        </div>
        <p style="color: #888; font-size: 13px;">If you didn't request for this, then ignore this email.</p>
      </div>
    `,
      });
      this.logger.log(
        `OTP email sent to ${to} (messageId: ${result.messageId})`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to send OTP email to ${to}`, error);
      if (error.statusCode === 400) {
        throw new BadRequestException('Bad request, Failed to send OTP');
      }
      throw new BadRequestException('Bad request, Failed to send OTP');
    }

  }
  async verifyOTPHash(plainOTP: string, HashedOTP: string): Promise<boolean> {
    return await bcrypt.compare(plainOTP, HashedOTP);
  }
}
