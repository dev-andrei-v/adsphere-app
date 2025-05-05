import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../../common/mongoose/base-schema-options';

@Schema(baseSchemaOptions)
export class Locality extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  county: string;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: {
    type: 'Point',
    coordinates: number[];
  };

}

export const LocalitySchema = SchemaFactory.createForClass(Locality);

LocalitySchema.index({ location: '2dsphere' });
