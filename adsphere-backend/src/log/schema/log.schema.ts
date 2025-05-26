export enum LogType {
  INFO = 'INFO',
  ACTION = 'ACTION',
  ERROR = 'ERROR',
}

export enum LogAction {
  POST_AD = 'post_ad',
  EDIT_AD = 'edit_ad',
  APPROVE_AD = 'approve_ad',
  REJECT_AD = 'reject_ad',
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Log extends Document {
  @Prop({ required: true, enum: LogType })
  logType: LogType;

  @Prop({ required: true, enum: LogAction })
  logAction: LogAction;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  by: string;

  @Prop({ required: false })
  category?: string;

  @Prop({ type: Object, required: false })
  extra?: Record<string, any>;
}

export const LogSchema = SchemaFactory.createForClass(Log);
