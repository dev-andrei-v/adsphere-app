import { Module } from '@nestjs/common';
import { Log, LogSchema } from './schema/log.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { LogsController } from './logs.controller';

@Module({
  controllers: [LogsController],
  providers: [],
  imports: [ MongooseModule.forFeature([
    { name: Log.name, schema: LogSchema },
  ])],
})
export class LogsModule {}
