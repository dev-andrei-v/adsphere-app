import { Global, Module } from '@nestjs/common';
import { CategoryModule } from './category/category.module';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AdModule } from './ad/ad.module';
import { LocalityModule } from './locality/locality.module';
import { StatsModule } from './stats/stats.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import Joi from 'joi';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitMqService } from './common/queue/rabbit-mq.service';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ChatModule } from './message/chat.module';
import { Ad, AdSchema } from './ad/schema/ad.schema';
import { Category, CategorySchema } from './category/schema/category.schema';
import { Locality, LocalitySchema } from './locality/schema/locality.schema';
import { User, UserSchema } from './user/schema/user.schema';
import { Message, MessageSchema } from './message/schema/message.schema';
import { FavoriteAd, FavoriteAdSchema } from './user/schema/favorite-ad.schema';
import { Log, LogSchema } from './log/schema/log.schema';
import { LogsModule } from './log/logs.module';

const envValidationSchema = Joi.object({
  PORT: Joi.number()
    .port()
    .default(8080)
    .description('The port on which the server will listen'),

  CORS_ORIGIN: Joi.string()
    .default('*')  // Default to allowing all origins
    .custom((value, helpers) => {
      // split on commas, trim whitespace
      const origins = value.split(',').map(o => o.trim());
      // validate each is a proper http(s) URI
      for (const origin of origins) {
        try {
          new URL(origin);
        } catch {
          return helpers.error('string.uri', { value: origin });
        }
      }
      return origins;  // return the array for use in your app
    })
    .description('Comma-separated list of allowed CORS origin URLs'),

  JWT_SECRET: Joi.string()
    .min(16)
    .required()
    .description('Secret key used to sign JWT tokens'),

  JWT_EXPIRATION: Joi.string()
    .default('7d')  // Default to 7 days
    .description('JWT token expiration time in seconds'),

  RABBITMQ_URL: Joi.string()
    .uri({ scheme: ['amqp', 'amqps'] })
    .required()
    .description('Connection URL for the RabbitMQ broker'),

  MONGODB_URI: Joi.string()
    .uri()
    .required()
    .description('MongoDB connection URI'),

  MONGODB_USER: Joi.string(),
  MONGODB_PASSWORD: Joi.string(),

  CLOUDINARY_CLOUD_NAME: Joi.string()
    .required()
    .description('Your Cloudinary cloud name'),

  CLOUDINARY_API_KEY: Joi.string()
    .required()
    .description('Your Cloudinary API key'),

  CLOUDINARY_API_SECRET: Joi.string()
    .required()
    .description('Your Cloudinary API secret'),

  ELASTICSEARCH_URL: Joi.string()
    .uri()
    .required()
    .description('Elasticsearch connection URL'),
})
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.dev'],
      validationSchema: envValidationSchema,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '7d', // Default expiration time
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        user: config.get('MONGODB_USER'),
        pass: config.get('MONGODB_PASSWORD'),
        authSource: 'admin',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Ad.name, schema: AdSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Locality.name, schema: LocalitySchema },
      { name: User.name, schema: UserSchema },
      { name: Message.name, schema: MessageSchema },
      { name: FavoriteAd.name, schema: FavoriteAdSchema },
      { name: Log.name, schema: LogSchema },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'ADSPHERE_QUEUE',
        imports: [ConfigModule],
        useFactory: async (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              config.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672',
            ],
            queue: 'ads.process',
            queueOptions: { durable: true },
            noAck: true,
          },
        }),
        inject: [ConfigService],
      },
    ]),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        node: config.get<string>('ELASTICSEARCH_URL'),
        compatibilityMode: true,
      }),
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      subscriptions: {
        'graphql-ws': true
      },
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    CategoryModule,
    UserModule,
    AdModule,
    LocalityModule,
    StatsModule,
    CloudinaryModule,
    ChatModule,
    HttpModule,
    LogsModule,
  ],
  controllers: [],
  providers: [RabbitMqService],
  exports: [JwtModule, RabbitMqService, HttpModule, ElasticsearchModule],
})
export class AppModule {}




