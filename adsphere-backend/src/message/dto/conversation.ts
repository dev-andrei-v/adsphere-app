import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
export class Conversation {
  @Field(() => ID)
  adId: string;

  @Field()
  adTitle: string;

  @Field({ nullable: true })
  adImage?: string;

  @Field(() => ID)
  sellerId: string;

  @Field()
  sellerName: string;

  @Field(() => ID)
  buyerId: string;

  @Field()
  buyerName: string;

  @Field()
  lastMessage: string;

  @Field(() => GraphQLISODateTime)
  lastMessageDate: string;
}
