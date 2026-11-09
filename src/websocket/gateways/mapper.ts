import { MessageDocument } from "../schema/message.schema";

export const toMessageDto = (m: MessageDocument) => ({
    status: m.status,
    message: m.message,
    messageid: m.messageId,
    createdAt: m.createdAt,
    senderid: m.senderId.toString(),
    conversationid: m.conversationId,
    receiverid: m.receiverId.toString(),
});