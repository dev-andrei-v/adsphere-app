import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { baseSchemaOptions } from '../../common/mongoose/base-schema-options';

@Schema()
export class AttributeValidation {
  @Prop()
  regex?: string;

  @Prop()
  minValue?: number;

  @Prop()
  maxValue?: number;

  @Prop()
  unit?: string;

  @Prop()
  errorMessage?: string;
}

const AttributeValidationSchema = SchemaFactory.createForClass(AttributeValidation);


@Schema()
export class AttributeTemplate {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true, enum: ['text', 'number', 'select', 'boolean'] })
  type: 'text' | 'number' | 'select' | 'boolean';

  @Prop({ type: [String] })
  options?: string[]; // only for select type

  @Prop()
  unit?: string; // optional, for number type

  @Prop({ type: AttributeValidationSchema })
  validation?: AttributeValidation; // optional, for validation rules

  @Prop({ default: false })
  isRequired: boolean;

  @Prop({ default: true })
  isUsedAsFilter: boolean; // indicates if this attribute can be used as a filter in category listings
}

const AttributeTemplateSchema = SchemaFactory.createForClass(AttributeTemplate);

@Schema(baseSchemaOptions)
export class Category extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;


  @Prop({
    type:
      {
        url: { type: String },
        publicId: { type: String },
      },
  })
  image?: {
    url: string;
    publicId: string;
  };

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'categories' })
  parentId?: mongoose.Schema.Types.ObjectId;

  @Prop({ type: [AttributeTemplateSchema], default: [] })
  attributes: AttributeTemplate[];

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: -1 })
  featuredOrderIndex: number;

  @Prop({ default: true })
  isEnabled: boolean
}

export const CategorySchema = SchemaFactory.createForClass(Category);
