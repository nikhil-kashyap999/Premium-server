import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Conversation {
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    required: true,
    index: true,
  })
  participants!: mongoose.Schema.Types.ObjectId[];

  @Prop({ required: true, unique: true })
  directKey!: string; // sorted ids join: "id1:id2"
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
export type ConversationDocument = HydratedDocument<Conversation>;
