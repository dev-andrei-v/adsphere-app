import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { RabbitMqService } from './common/queue/rabbit-mq.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'AdSphere Backend', // Default is "Nest"
    }),
  });

  const config = app.get(ConfigService);
  const port = config.get('PORT', 8080);
  const corsOrigin = config.get<string[]>('CORS_ORIGIN', ['*']);
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.setGlobalPrefix('api/v1');

  await app.listen(port, "0.0.0.0");
}
bootstrap()
  .then(() => {})
  .catch(() => {});
