import { Module } from '@nestjs/common';
import { CommonAuthService } from './common-auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from './guards/roles.guards';
import { JwtStrategy } from './stretagy/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30m' },
    }),
  ],
  providers: [CommonAuthService, JwtStrategy,RolesGuard],
  exports: [
    JwtStrategy,
    RolesGuard,
    PassportModule,
    JwtModule,
    CommonAuthModule,
  ],
})
export class CommonAuthModule {}
