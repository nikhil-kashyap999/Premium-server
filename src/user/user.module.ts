import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { User, UserSchema } from './schemas/user.schema';
import { Contacts, ContactSchema } from './schemas/contacts.schema';
import { CommonAuthModule } from 'src/common-auth/common-auth.module';
import { ChatRequest, ChatRequestSchema } from './schemas/chatRequest.schema';
import {
  Conversation,
  ConversationSchema,
} from 'src/websocket/schema/conversations.schema';

@Module({
  imports: [
    CommonAuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ChatRequest.name, schema: ChatRequestSchema },
      { name: Contacts.name, schema: ContactSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
