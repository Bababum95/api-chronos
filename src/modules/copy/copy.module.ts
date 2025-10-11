import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserSchema } from '@/schemas/user.schema';

import { CopyService } from './copy.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'NewUser', schema: UserSchema, collection: 'users' }]),

    // sourceConnection
    MongooseModule.forFeature(
      [{ name: 'OldUser', schema: UserSchema, collection: 'users' }],
      'sourceConnection'
    ),
  ],
  providers: [CopyService],
  exports: [CopyService],
})
export class CopyModule {}
