import { IsEmail, IsNotEmpty, IsString, Length, MaxLength, MinLength } from "class-validator";

export class PasswordResetDto {
    @IsNotEmpty({ message: 'OTP required' })
    @Length(6, 6, { message: 'OTP must be 6 charater long' })
    @IsString({ message: 'OTP must be in string format' })
    OTP!: string;

    @IsNotEmpty({ message: 'password required' })
    @IsString({ message: 'password must be string' })
    @MaxLength(50, { message: 'password lenght must be below 50 characters' })
    @MinLength(3, { message: 'password must be longer then 2 characters' })
    newPassword!: string;

    // @IsNotEmpty({ message: "Email required" })
    // @IsEmail({}, { message: "Provide a valid email" })
    // Email!: string;
}