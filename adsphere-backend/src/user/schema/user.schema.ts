import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserType } from '../enums/user-type.enum';
import { UserAuthProvider } from '../enums/user-auth-provider.enum';

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const id: string = ret._id;
      delete ret._id;
      delete ret.__v;
      return {
        id,
        ...ret,
      };
    },
  },
})
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false })
  password: string;

  @Prop({ required: true, enum: UserType, default: UserType.USER_INDIVIDUAL })
  type: UserType;

  @Prop({ required: true, enum: UserAuthProvider, default: UserAuthProvider.LOCAL })
  authProvider: UserAuthProvider;

  @Prop({ type: Date, default: Date.now })
  lastLoginAt: Date;

  @Prop({ type: Date, default: Date.now })
  lastSeenAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
