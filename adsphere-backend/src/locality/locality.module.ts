import { Module } from '@nestjs/common';
import { LocalityService } from './locality.service';
import { LocalityController } from './locality.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Locality, LocalitySchema } from './schema/locality.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Locality.name, schema: LocalitySchema },
    ]),
  ],
  controllers: [LocalityController],
  providers: [LocalityService],
})
export class LocalityModule {}
