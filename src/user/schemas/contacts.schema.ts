import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ContactDocument = HydratedDocument<Contacts>;

@Schema({ timestamps: true })
export class Contacts {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId!: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  contactUserId!: mongoose.Types.ObjectId;

  @Prop({ default: false })
  isBlocked!: boolean;

  @Prop({ default: false })
  isFavorite!: boolean;
}

export const ContactSchema = SchemaFactory.createForClass(Contacts);

// compound unique index — duplicate contacts avoid karne ke liye
ContactSchema.index({ userId: 1, contactUserId: 1 }, { unique: true });
