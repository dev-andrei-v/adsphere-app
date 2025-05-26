import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserAdminController} from './user.admin.controller';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { AdService } from '../ad/ad.service';
import { Ad, AdSchema } from '../ad/schema/ad.schema';
import { Category, CategorySchema } from '../category/schema/category.schema';
import { Locality, LocalitySchema } from '../locality/schema/locality.schema';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { UserSchedulerService } from './user-scheduler.service';
import { AdSearchService } from '../ad/ad-search.service';
import { Message, MessageSchema } from '../message/schema/message.schema';
import { FavoriteAd, FavoriteAdSchema } from './schema/favorite-ad.schema';
import { UserFavoriteService } from './user-favorite.service';
import { Log, LogSchema } from '../log/schema/log.schema';
import { AdView, AdViewSchema } from '../ad/schema/ad-view.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Ad.name, schema: AdSchema },
    { name: Category.name, schema: CategorySchema },
    { name: Locality.name, schema: LocalitySchema },
    { name: User.name, schema: UserSchema },
    { name: Message.name, schema: MessageSchema },
    { name: FavoriteAd.name, schema: FavoriteAdSchema },
    { name: Log.name, schema: LogSchema },
    { name: AdView.name, schema: AdViewSchema}
  ]),
  CloudinaryModule],
  providers: [UserService, AdService, UserSchedulerService, AdSearchService, UserFavoriteService],
  controllers: [
    UserAdminController,
    UserController
  ],
  exports: [UserService, UserSchedulerService],
})
export class UserModule {}
