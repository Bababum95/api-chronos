import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { File, FileSchema } from '@/schemas/file.schema';
import { User, UserSchema } from '@/schemas/user.schema';

import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: File.name, schema: FileSchema },
    ]),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
