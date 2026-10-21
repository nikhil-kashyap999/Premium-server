import {IsMongoId, IsNotEmpty, IsString, Length } from 'class-validator';

export class OTPDto {
  @IsNotEmpty({ message: 'OTP required' })
  @Length(6, 6, { message: 'OTP must be 6 charater long' })
  @IsString({ message: 'OTP must be in string format' })
  OTP!: string;

  // @IsNotEmpty({ message: 'userid required' })
  // @IsString({ message: 'OTP must be in string format' })
  // @IsMongoId({ message: 'Id must be a monogoDB id' })
  // userId!: string;

  // @IsNotEmpty({ message: 'username required' })
  // @IsString({ message: 'OTP must be in string format' })
  // username!: string;
}
