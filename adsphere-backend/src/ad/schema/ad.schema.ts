import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, Types } from "mongoose";
import { AdTransactionType } from '../enums/ad-transaction.type';
import { AdCurrencyEnum } from '../enums/ad-currency.enum';
import { AdStatus } from '../enums/ad-status.enum';
import { baseSchemaOptions } from '../../common/mongoose/base-schema-options';
import slugify from 'slugify';
import { UserType } from '../../user/enums/user-type.enum';

@Schema(baseSchemaOptions)
export class Ad extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: false })
  price: number;

  @Prop({ enum: AdCurrencyEnum, default: AdCurrencyEnum.RON })
  currency: string;

  @Prop({ enum: AdTransactionType, default: AdTransactionType.FIXED, required: true })
  priceType: AdTransactionType;

  @Prop({ type: Types.ObjectId, ref: "Category", required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: UserType })
  userAccountType: UserType;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  attributes: Record<string, string | number | boolean>;

  @Prop({ type: Number, default: 0 })
  viewsCounter: number;

  @Prop({
    type: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        isFeatured: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  images: {
    url: string;
    publicId: string;
    isFeatured: boolean;
  }[];

  @Prop({
    type: {
      name: { type: String },
      county: { type: String },
      latitude: Number,
      longitude: Number,
    },
    required: true,
  })
  locality: {
    name: string;
    county: string;
    latitude?: number;
    longitude?: number;
  };

  @Prop({ enum: AdStatus, default: AdStatus.PENDING })
  status: AdStatus;

  createdAt: Date;
  updatedAt: Date;
}


export const AdSchema = SchemaFactory.createForClass(Ad);

AdSchema.pre('save', function (next) {
  if (!this.isModified('title')) return next();

  const idPart = this._id!.toString().slice(-6);
  const titleSlug = slugify(this.title, { lower: true, strict: true });
  this.slug = `${titleSlug}-${idPart}`;
  next();
});
