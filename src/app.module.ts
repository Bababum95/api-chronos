import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { loadConfiguration } from '@/config/configuration';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { HeartbeatsModule } from '@/modules/heartbeats/heartbeats.module';
import { SummariesModule } from '@/modules/summaries/summaries.module';
import { FilesModule } from '@/modules/files/files.module';
import { UploadModule } from '@/modules/upload/upload.module';
import { PingModule } from '@/modules/ping/ping.module';
import { CopyModule } from '@/modules/copy/copy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfiguration],
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('DB_NAME') || 'chronos_db',
      }),
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      connectionName: 'sourceConnection',
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('SOURCE_DB_NAME'),
      }),
    }),

    AuthModule,
    UsersModule,
    HeartbeatsModule,
    SummariesModule,
    FilesModule,
    UploadModule,
    PingModule,
    CopyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
