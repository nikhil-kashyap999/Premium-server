import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ChatRequestDocument = HydratedDocument<ChatRequest>;
@Schema({ timestamps: true })
export class ChatRequest {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  senderId!: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  receiverId!: mongoose.Types.ObjectId;

  @Prop({
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING',
  })
  status!: string;
}

export const ChatRequestSchema = SchemaFactory.createForClass(ChatRequest);
