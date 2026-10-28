import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {HydratedDocument, Types} from "mongoose";


@Schema({timestamps:true})
export class PasswordReset{
    @Prop({type:Types.ObjectId, ref:"User",required:true,unique:true})
    userId!:Types.ObjectId;

    @Prop({required:true})
    otpHash!:string;

    @Prop({required:true})
    expiresAt!:Date;

    @Prop({default:0})
    attempts!:number;
}
export type PasswordResetDocument = HydratedDocument<PasswordReset>;
export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);
PasswordResetSchema.index({expiresAt:1},{expireAfterSeconds:0});