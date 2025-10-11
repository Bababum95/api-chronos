import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { CopyService } from '../src/modules/copy/copy.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const copy = app.get(CopyService);

  await copy.copyHeartbeatsToNewDb();
  await app.close();
}

bootstrap();
