import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { FileSchema } from '@/schemas/file.schema';
import { HeartbeatSchema } from '@/schemas/heartbeat.schema';
import { UserSchema } from '@/schemas/user.schema';

import { CopyService } from './copy.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'NewUser', schema: UserSchema, collection: 'users' },
      { name: 'NewFile', schema: FileSchema, collection: 'files' },
      { name: 'NewHeartbeat', schema: HeartbeatSchema, collection: 'heartbeats' },
    ]),

    // Source Database
    MongooseModule.forFeature(
      [
        { name: 'OldUser', schema: UserSchema, collection: 'users' },
        { name: 'OldFile', schema: FileSchema, collection: 'files' },
        { name: 'OldHeartbeat', schema: HeartbeatSchema, collection: 'heartbeats' },
      ],
      'sourceConnection'
    ),
  ],
  providers: [CopyService],
  exports: [CopyService],
})
export class CopyModule {}
