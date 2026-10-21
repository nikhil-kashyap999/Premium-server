import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsEmail,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'username required' })
  @IsString({ message: 'username must be string' })
  @MaxLength(50, { message: 'username lenght must be below 50 characters' })
  @MinLength(3, { message: 'username must be longer then 2 characters' })
  username: string;

  @IsNotEmpty({ message: 'password required' })
  @IsString({ message: 'password must be string' })
  @MaxLength(50, { message: 'password lenght must be below 50 characters' })
  @MinLength(3, { message: 'password must be longer then 2 characters' })
  password: string;

  @IsEmail()
  @IsNotEmpty({ message: 'email required' })
  @MaxLength(50, { message: 'email lenght must be below 50 characters' })
  @MinLength(3, { message: 'username must be longer then 2 characters' })
  email: string;

  @IsNotEmpty({ message: 'Avatar url required' })
  @IsString({ message: 'avatarurl must be string' })
  @MaxLength(500, { message: 'avatarUrl lenght must be below 500 characters' })
  @MinLength(3, { message: 'avatarUrl must be longer then 2 characters' })
  avatarUrl: string;
}
