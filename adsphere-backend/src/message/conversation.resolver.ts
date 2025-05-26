import { Args, ID, Info, Query, Resolver } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import { Conversation } from './dto/conversation';
import { GraphQLResolveInfo } from 'graphql/type';

@Resolver(() => Conversation)
export class ConversationResolver {
  constructor(private readonly chatService: ChatService) {}

  @Query(() => [Conversation], { name: 'conversations' })
  async conversations(
    @Args('userId', { type: () => ID }) userId: string,
    @Info() info: GraphQLResolveInfo
  ): Promise<Conversation[]> {
    return await this.chatService.getConversations(userId, info);
  }
}
