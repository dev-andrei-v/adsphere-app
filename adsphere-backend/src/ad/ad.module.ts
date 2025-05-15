import { Module } from '@nestjs/common';
import { AdService } from './ad.service';
import { AdController } from './ad.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Ad, AdSchema } from './schema/ad.schema';
import { Locality, LocalitySchema } from '../locality/schema/locality.schema';
import { Category, CategorySchema } from '../category/schema/category.schema';
import { AdAdminController } from './ad.admin.controller';
import { AdAdminService } from './ad.admin.service';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { LocalityService } from '../locality/locality.service';
import { UserService } from '../user/user.service';
import { User, UserSchema } from '../user/schema/user.schema';
import { AdSearchService } from './ad-search.service';
import { ElasticsearchModule, ElasticsearchService } from '@nestjs/elasticsearch';
import { AdAIService } from './ad-ai.service';
import { Message, MessageSchema } from '../message/schema/message.schema';
import { FavoriteAd, FavoriteAdSchema } from '../user/schema/favorite-ad.schema';
import { Log, LogSchema } from '../log/schema/log.schema';
import { AdView, AdViewSchema } from './schema/ad-view.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ad.name, schema: AdSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Locality.name, schema: LocalitySchema },
      { name: User.name, schema: UserSchema },
      { name: Message.name, schema: MessageSchema },
      { name: FavoriteAd.name, schema: FavoriteAdSchema },
      { name: Log.name, schema: LogSchema },
      { name: AdView.name, schema: AdViewSchema}
    ]),
    CloudinaryModule,
  ],
  controllers: [AdController, AdAdminController],
  providers: [AdService, AdAdminService, LocalityService, UserService, AdSearchService, AdAIService],
  exports: [AdService]
})
export class AdModule {}
