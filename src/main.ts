import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // HTTP request logging
  const nodeEnv = configService.get<string>('NODE_ENV');
  const morganFormat = nodeEnv === 'production' ? 'combined' : 'dev';
  app.use(morgan(morganFormat));

  // Security: HTTP headers protection
  app.use(helmet());

  // Performance: Enable gzip compression
  app.use(compression());

  // Enable CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || '*',
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api/v1');

  // Enable validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Read configuration values
  const port = configService.get<number>('PORT') || 3001;
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const appUrl = configService.get<string>('APP_URL');

  await app.listen(port);

  console.info(`🚀 API Chronos running on ${appUrl}/api/v1`);
  console.info(`📦 Environment: ${nodeEnv}`);
  console.info(`🔗 CORS enabled for: ${corsOrigin}`);
}

bootstrap();
