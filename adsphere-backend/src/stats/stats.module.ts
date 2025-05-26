import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Ad, AdSchema } from '../ad/schema/ad.schema';
import { User, UserSchema } from '../user/schema/user.schema';
import { AdService } from '../ad/ad.service';
import { UserService } from '../user/user.service';
import { Category, CategorySchema } from '../category/schema/category.schema';
import { Locality, LocalitySchema } from '../locality/schema/locality.schema';
import { AdModule } from '../ad/ad.module';
import { Message, MessageSchema } from '../message/schema/message.schema';
import { Log, LogSchema } from '../log/schema/log.schema';

@Module({
  controllers: [StatsController],
  providers: [StatsService, UserService],
  imports: [ AdModule, MongooseModule.forFeature([
    { name: Ad.name, schema: AdSchema },
    { name: Category.name, schema: CategorySchema },
    { name: Locality.name, schema: LocalitySchema },
    { name: User.name, schema: UserSchema },
    { name: Message.name, schema: MessageSchema },
    { name: Log.name, schema: LogSchema },
  ])],
})
export class StatsModule {}
