import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { Offer, OfferSchema } from './offer.schema';

export type MessageDocument = Message & Document;

@Schema({
  timestamps: true,
})
export class Message {
  _id: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  adId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  senderId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  receiverId: Types.ObjectId;

  @Prop()
  content?: string

  @Prop({ type: OfferSchema, required: false })
  offer?: Offer;

  createdAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
