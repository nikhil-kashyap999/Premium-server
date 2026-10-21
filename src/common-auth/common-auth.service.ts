import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../user/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CommonAuthService {
  constructor(private readonly jwtService: JwtService) {}

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
