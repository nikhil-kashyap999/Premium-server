import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'src/user/user.module';
import { MessageService } from './message.service';
import { PresenceService } from './presence.service';
import { ChatGateway } from './gateways/chat.gateway';
import { Message, MessageSchema } from './schema/message.schema';
import { CommonAuthModule } from 'src/common-auth/common-auth.module';
import { Conversation, ConversationSchema } from './schema/conversations.schema';

@Module({
  imports: [CommonAuthModule, UserModule, MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }, { name: Conversation.name, schema: ConversationSchema }])],
  providers: [ChatGateway, MessageService, PresenceService],
})
export class WebsocketModule { }