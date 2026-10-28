import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserService } from 'src/user/user.service';
import { NewMessageDto } from '../dto/NewMessage.dto';
import { MessageService } from '../message.service';
import { PresenceService } from '../presence.service';
import { wsAuthMiddleware } from '../middlewares/ws-auth.moddleware';
import { OnEvent } from '@nestjs/event-emitter';
import { MessageStatusDto } from '../dto/MessageStatus.dto';


@WebSocketGateway({
  cors: {
    origin: [process.env.CLIENT_URL, 'http://localhost:3000'],
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
    private messageService: MessageService,
    private presenceService: PresenceService,
  ) { }

  afterInit() {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET must be defined');
    }

    this.server.use(wsAuthMiddleware(this.jwtService, jwtSecret));
    console.log('🚀 WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    const userId = client.data.user?.sub;
    if (!userId) return client.disconnect(true);

    const cameOnline = this.presenceService.add(userId, client.id);
    await client.join(`user:${userId}`);
    if (cameOnline) {
      await this.updateUserPresence(userId);
      // console.log(
      //   `✅ Client connected: ${client.id} | Joined room: user:${userId}`,
      // );
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    const wentOffline = this.presenceService.remove(userId, client.id);
    if (!wentOffline) return; // dusre tabs/devices abhi connected hain

    this.presenceService.scheduleOffline(userId, async () => {
      const contactids = await this.userService.getContactsIds(userId);
      if (this.presenceService.isOnline(userId)) return; // await ke baad recheck

      await this.userService.logout(userId);
      if (this.presenceService.isOnline(userId)) {
        return;
      }
      contactids?.forEach((c) =>
        this.server
          .to(`user:${c}`)
          .emit('presence:update', { userid: userId, isActive: false }),
      );
    });
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: string, @ConnectedSocket() client: Socket) {
    // console.log('📩 Received from client:', data);
    client.emit('pong', 'Hello from server');
  }

  @SubscribeMessage('message:send')
  async onSend(
    @MessageBody() dto: NewMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const senderid = client.data.user.sub;
    const room = `user:${dto.receiverid}`;
    const senderRoom = `user:${senderid}`;
    const message = await this.messageService.send(senderid, dto);
    this.server.to(room).emit('message:new', message);
    if (this.presenceService.isOnline(dto.receiverid)) {
      this.server.to(senderRoom).emit('message:ack', {
        messageid: dto.messageid,
        receiverid: dto.receiverid,
      });
    }

  }

  @SubscribeMessage('message:status')
  async onMessageStatus(
    @MessageBody() dto: MessageStatusDto,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `user:${dto.receiverid}`;
    this.server.to(room).emit('message:status', {
      messageid: dto.messageid,
      receiverid: dto.receiverid,
      status: dto.status,
      senderid: client.data.user.sub,
    });
  }

  @OnEvent('invite.sent')
  async sendInviteNotification(obj: {
    receiverId: string;
    event: string;
    payload: any;
  }) {
    this.server.to(`user:${obj.receiverId}`).emit(obj.event, obj.payload);
  }

  // ---------------------------------------service functions-----------------------------------
  async updateUserPresence(userid: string) {
    const contactids = await this.userService.getContactsIds(userid);
    if (contactids) {
      contactids.forEach((cid) =>
        this.server
          .to(`user:${cid}`)
          .emit('presence:update', { userid, isActive: true }),
      );
    }
  }
}
