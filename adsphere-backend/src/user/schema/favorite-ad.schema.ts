import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { baseSchemaOptions } from '../../common/mongoose/base-schema-options';

@Schema(baseSchemaOptions)
export class FavoriteAd extends Document {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Ad", required: true, index: true })
  adId: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const FavoriteAdSchema = SchemaFactory.createForClass(FavoriteAd);

// Optional: index to prevent duplicates
FavoriteAdSchema.index({ userId: 1, adId: 1 }, { unique: true });
