import { ConsoleLogger, Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schema/category.schema';
import { AuthModule } from '../auth/auth.module';
import { CategoryAdminController } from './category.admin.controller';
import { AdService } from '../ad/ad.service';
import { Ad, AdSchema } from '../ad/schema/ad.schema';
import { Locality, LocalitySchema } from '../locality/schema/locality.schema';
import { AdModule } from '../ad/ad.module';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { Log, LogSchema } from '../log/schema/log.schema';

@Module({
  imports: [
    AuthModule,
    AdModule,
    MongooseModule.forFeature([
      { name: Ad.name, schema: AdSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Locality.name, schema: LocalitySchema },
      { name: Log.name, schema: LogSchema },
    ]),
    CloudinaryModule
  ],
  providers: [CategoryService],
  controllers: [
    CategoryController,
    CategoryAdminController,
  ],
})
export class CategoryModule {}
