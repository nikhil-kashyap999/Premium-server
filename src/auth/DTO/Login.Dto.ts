import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDTO {
  @IsNotEmpty({ message: 'username required' })
  @IsString({ message: 'username must be string' })
  @MaxLength(50, { message: 'username lenght must be below 50 characters' })
  @MinLength(3, { message: 'username must be longer then 2 characters' })
  username!: string;

  @IsNotEmpty({ message: 'password required' })
  @IsString({ message: 'password must be string' })
  @MaxLength(50, { message: 'password lenght must be below 50 characters' })
  @MinLength(3, { message: 'password must be longer then 2 characters' })
  password!: string;
}
