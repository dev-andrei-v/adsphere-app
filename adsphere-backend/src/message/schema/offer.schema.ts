import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export class Offer {
  @Prop({ required: true, enum: ['auction', 'exchange', 'negotiable'] })
  type: 'auction' | 'exchange' | 'negotiable';

  @Prop({ required: false })
  amount?: number; // The amount offered in the case of an auction or exchange

  @Prop({ type: Types.ObjectId, ref: "Ad" })
  exchangeAdId?: Types.ObjectId;
}


export const OfferSchema = SchemaFactory.createForClass(Offer);
