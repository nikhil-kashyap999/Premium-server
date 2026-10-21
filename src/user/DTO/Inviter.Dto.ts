import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class InviteDto {
  // @IsNotEmpty({ message: 'SenderId required' })
  // @IsString({ message: 'SenderId must be string' })
  // @MaxLength(200, { message: 'Senderid lenght must be below 200 characters' })
  // @MinLength(10, { message: 'Senderid must be longer then 10 characters' })
  // senderId!: string;

  @IsNotEmpty({ message: 'ReceiverId required' })
  @IsString({ message: 'ReceiverId must be string' })
  @MaxLength(200, { message: 'Receiverid lenght must be below 200 characters' })
  @MinLength(5, { message: 'Receiverid must be longer then 5 characters' })
  receiverId!: string;
}
