import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { StatusType } from '../schema/message.schema';

export class MessageStatusDto {
  @IsNotEmpty({ message: 'messageid required' })
  @IsString({ message: 'messageid must be string' })
  messageid!: string;

  @IsNotEmpty({ message: 'receiverid required' })
  @IsString({ message: 'receiverid must be string' })
  receiverid!: string;

  @IsEnum(StatusType, { message: 'status must be a valid message status' })
  status!: StatusType;
}
