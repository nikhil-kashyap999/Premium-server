import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
class Media {
  @Prop({ required: true })
  image_url!: string;
}
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}
export const mediaSchema = SchemaFactory.createForClass(Media);
export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ required: true })
  avatarUrl!: string;

  @Prop({ required: true, default: false })
  isActive!: boolean;

  @Prop({ required: true, enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Prop({ type: Boolean, default: false })
  isVerified!: boolean;

  @Prop({ type: String })
  verificationToken!: string | undefined;

  @Prop({ expires: '15m' })
  unverifiedExpiresAt?: Date;

  @Prop({default:0})
  otpAttempts!:number;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  contacts!: mongoose.Types.ObjectId[];

  @Prop({ type: [mediaSchema], default: [] })
  media!: Media[];
}

export const UserSchema = SchemaFactory.createForClass(User);
