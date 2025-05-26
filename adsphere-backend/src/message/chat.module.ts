import { Module } from '@nestjs/common';
import { Message, MessageSchema } from './schema/message.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { MessageResolver } from './message.resolver';
import { ConversationResolver } from './conversation.resolver';
import { Ad, AdSchema } from '../ad/schema/ad.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ad.name, schema: AdSchema },
      { name: Message.name, schema: MessageSchema }
    ]),
  ],
  providers: [
    ChatService,
    MessageResolver,
    ConversationResolver,
  ],
  exports: [
    ChatService,
  ],
})
export class ChatModule {}
