import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { MessageService } from './message.service';
import { PresenceService } from './presence.service';
import { ChatGateway } from './gateways/chat.gateway';
import { CommonAuthModule } from 'src/common-auth/common-auth.module';

@Module({
  imports: [CommonAuthModule, UserModule],
  providers: [ChatGateway, MessageService, PresenceService],
})
export class WebsocketModule {}
