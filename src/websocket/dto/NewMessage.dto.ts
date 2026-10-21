import { IsNotEmpty, IsString } from 'class-validator';

export class NewMessageDto {
  @IsNotEmpty({ message: 'MesageId required' })
  @IsString({ message: 'messageid must be string' })
  messageid?: string;

  @IsNotEmpty({ message: 'participantID required' })
  @IsString({ message: 'participantID must be string' })
  receiverid!: string;

  @IsNotEmpty({ message: 'Message required' })
  @IsString({ message: 'Message must be in string' })
  message!: string;
}
