import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { CommonAuthModule } from 'src/common-auth/common-auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [UserModule, CommonAuthModule, EmailModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
