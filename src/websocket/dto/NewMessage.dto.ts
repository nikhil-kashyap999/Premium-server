import { IsNotEmpty, IsString } from 'class-validator';
import { MessageType } from '../schema/message.schema';

export class NewMessageDto {
  @IsNotEmpty({ message: 'MesageId required' })
  @IsString({ message: 'messageid must be string' })
  messageid!: string;

  @IsNotEmpty({ message: 'participantID required' })
  @IsString({ message: 'participantID must be string' })
  receiverid!: string;

  @IsNotEmpty({ message: 'Message required' })
  @IsString({ message: 'Message must be in string' })
  message!: string;

  @IsNotEmpty({ message: 'ConversationId required' })
  @IsString({ message: 'ConversationId must be string' })
  conversationid!: string;

  @IsNotEmpty({ message: 'Message Type required' })
  @IsString({ message: 'Message Type must be string' })
  messageType?: MessageType;
}
