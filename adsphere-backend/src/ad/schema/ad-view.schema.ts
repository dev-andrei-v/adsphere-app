import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { baseSchemaOptions } from '../../common/mongoose/base-schema-options';

@Schema()
export class AdView extends Document {
  @Prop({ type: Types.ObjectId, ref: "Ad", required: true, index: true })
  adId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: false, index: true })
  userId?: Types.ObjectId; // optional, pentru useri nelogați

  @Prop({ type: String, required: false })
  deviceId?: string; // poți salva device sau IP pentru guest views

  @Prop({ default: Date.now })
  viewedAt: Date;
}

export const AdViewSchema = SchemaFactory.createForClass(AdView);

// Optional: index for fast aggregation
AdViewSchema.index({ adId: 1, viewedAt: 1 });
AdViewSchema.index({ userId: 1, adId: 1 });
