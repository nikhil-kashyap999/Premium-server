import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export class MessageStatusDto {
  @IsNotEmpty({ message: 'messageid required' })
  @IsString({ message: 'messageid must be string' })
  messageid!: string;

  @IsNotEmpty({ message: 'receiverid required' })
  @IsString({ message: 'receiverid must be string' })
  receiverid!: string;

  @IsEnum(MessageStatus, { message: 'status must be a valid message status' })
  status!: MessageStatus;
}
