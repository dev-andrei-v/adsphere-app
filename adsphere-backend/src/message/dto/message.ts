import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Offer {
  @Field()
  type: 'auction' | 'exchange' | 'negotiable';

  @Field({ nullable: true })
  amount?: number;

  @Field(() => ID, { nullable: true })
  exchangeAdId?: string;
}

@ObjectType()
export class Message {
  @Field(() => ID)
  _id: string;

  @Field(() => ID)
  adId: string;

  @Field(() => ID)
  senderId: string;

  @Field(() => ID)
  receiverId: string;

  @Field()
  content?: string;

  @Field(() => Offer, { nullable: true })
  offer?: Offer;

  @Field()
  createdAt: Date;
}
