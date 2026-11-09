import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { getConversationId } from 'src/utils/getConversationid';
import { Message, MessageDocument, MessageType } from './schema/message.schema';
import { Conversation, ConversationDocument } from './schema/conversations.schema';


type PayloadType = {
  messageid: string;
  message: string;
  receiverid: string;
  conversationid: string;
  messageType?: MessageType;
};

@Injectable()
export class MessageService {
  constructor(@InjectModel(Message.name) private readonly messageModal: Model<MessageDocument>,
    @InjectModel(Conversation.name) private readonly convoModal: Model<ConversationDocument>) {}

  async Save(
    senderid: string,
    payload: PayloadType,
    isReceiverOnline?: boolean,

  ): Promise<MessageDocument> {
    const isDelivered = isReceiverOnline;
    try {
      const conversation = getConversationId(senderid, payload.receiverid);
      const conversationId = await this.convoModal.findOne({ directKey: conversation });
      return await this.messageModal.create({
        senderId: senderid,
        message: payload.message,
        messageId: payload.messageid,
        receiverId: payload.receiverid,
        conversationId: conversationId?._id,
        status: isDelivered ? "Delivered" : "Pending",
        ...(isDelivered && { deliveredAt: new Date() }),
      })
    } catch (err: any) {
      if (err.code === 11000) {
        const existing = await this.messageModal.findOne({ messageId: payload.messageid });
        if (existing) return existing;
      }
      throw err;
    }
  }
}

// return {
//   senderid,
//   message: payload.message,
//   messageid: payload.messageid,
//   receiverid: payload.receiverid,
// };