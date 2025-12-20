import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';

import { AppModule } from './app.module';
import { API_PREFIX } from './config/constants';
import { setupSwagger } from './config/swagger.config';

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
  app.setGlobalPrefix(API_PREFIX);

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

  // Swagger: only enable in non-production environments
  if (nodeEnv !== 'production') {
    setupSwagger(app);
  }

  await app.listen(port, '0.0.0.0');

  console.info(`🚀 API Chronos running on ${appUrl}/${API_PREFIX}`);
  console.info(`📦 Environment: ${nodeEnv}`);
  console.info(`🔗 CORS enabled for: ${corsOrigin}`);
  console.info(`🔗 APP listening on ${port}`);
  console.info(`📖 API documentation: ${appUrl}/api/docs`);
}

bootstrap();
