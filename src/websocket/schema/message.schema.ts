import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export enum MessageType {
    Text = "Text",
    Media = "Media"
}
export const StatusType = {
    Sent: 'Sent',
    Seen: 'Seen',
    Error: 'Error',
    Pending: 'Pending',
    Delivered: 'Delivered',
} as const;

export type StatusType = (typeof StatusType)[keyof typeof StatusType];

@Schema({ timestamps: true })
export class Message {
    @Prop({ type: String, required: true, unique: true })
    messageId!: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
    senderId!: mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
    receiverId!: mongoose.Types.ObjectId;

    @Prop({ type: String, required: true })
    message!: string;

    @Prop({ type: String, enum: Object.values(StatusType), required: true, default: StatusType.Pending })
    status!: StatusType;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true })
    conversationId!: mongoose.Types.ObjectId;

    @Prop({ enum: MessageType, default: "Text" })
    messageType!: MessageType

    @Prop({ type: Boolean, default: false })
    deleted!: boolean;

    @Prop({ type: String }) mediaUrl?: string;
    @Prop({ type: Date }) deliveredAt?: Date;
    @Prop({ type: Date }) seenAt?: Date;

    createdAt!: Date;
    updatedAt!: Date;
}


export type MessageDocument = HydratedDocument<Message>;
export const MessageSchema = SchemaFactory.createForClass(Message);