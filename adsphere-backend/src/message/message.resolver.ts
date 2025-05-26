import { ChatService } from './chat.service';
import {
  Args,
  Field, ID,
  InputType,
  Mutation,
  Resolver,
  Subscription,
  Query, registerEnumType,
} from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { Message } from './dto/message';
import { Logger } from '@nestjs/common';

export enum OfferType {
  AUCTION = 'auction',
  EXCHANGE = 'exchange',
  NEGOTIABLE = 'negotiable',
}

registerEnumType(OfferType, {
  name: 'OfferType',
  description: 'Type of offer for a message',
})

@InputType()
export class CreateOfferInput {
  @Field(() => OfferType)
  type: OfferType;

  @Field({ nullable: true })
  amount?: number;

  @Field(() => ID, { nullable: true })
  exchangeAdId?: string;
}

@InputType()
export class ContactAdInput {
  @Field(() => ID)
  adId: string;

  @Field(() => ID)
  senderId: string;

  @Field({ nullable: true })
  content?: string;

  @Field(() => CreateOfferInput, { nullable: true })
  offer?: CreateOfferInput;
}

@InputType()
export class CreateMessageInput {
  @Field(() => ID)
  adId: string;

  @Field(() => ID)
  senderId: string;

  @Field(() => ID)
  receiverId: string;

  @Field({ nullable: true })
  content?: string;
}

const pubSub = new PubSub();

@Resolver(() => Message)
export class MessageResolver {
  private readonly logger = new Logger(MessageResolver.name);

  constructor(private readonly chatService: ChatService) {}

  @Query(() => [Message], { name: 'messages' })
  async messages(
    @Args('adId', { type: () => ID }) adId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('sellerId', { type: () => ID }) sellerId: string,
    @Args('buyerId', { type: () => ID }) buyerId: string,
  ): Promise<Message[]> {
    return await this.chatService.getMessagesByAd(adId, userId, sellerId, buyerId);
  }

  @Mutation(() => Boolean, { name: 'sendMessage' })
  async sendMessage(
    @Args('input') input: CreateMessageInput,
  ): Promise<boolean> {
    const msg = await this.chatService.post(input);
    if(msg) {
      await pubSub.publish(`message_${input.adId}`, { messageSent: msg });
      return true;
    }
    return false;
  }

  @Mutation(() => Boolean, { name: 'contactSellerForAd' })
  async contactSellerForAd(
    @Args('input') input: ContactAdInput,
  ): Promise<boolean> {
    return this.chatService.contactSellerWithOffer(input);
  }

  @Subscription(() => Message, {
    filter: (payload, variables) => {
      if (!variables.adId) return false;
      return payload.messageSent?.adId === variables.adId;
    }
  })
  messageSent(@Args('adId', { type: () => ID }) adId: string) {
    // This subscription will listen for new messages related to a specific adId
    this.logger.log('messageSent', adId);
    return pubSub.asyncIterableIterator(`message_${adId}`);
  }
}
