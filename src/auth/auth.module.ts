import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { CommonAuthModule } from 'src/common-auth/common-auth.module';
import { EmailModule } from '../email/email.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PasswordReset, PasswordResetSchema } from './schema/password-reset.schema';

@Module({
  imports: [UserModule, CommonAuthModule, EmailModule, MongooseModule.forFeature([{ name: PasswordReset.name, schema: PasswordResetSchema }])],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule { }
