import { IsEmail, IsNotEmpty } from "class-validator";

export class ForgetPasswordDto{
    @IsNotEmpty({message:"Email required"})
    @IsEmail({},{message:"Provide a valid email"})
    Email!:string;
}