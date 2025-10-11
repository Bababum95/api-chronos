import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { File, FileSchema } from '../../schemas/file.schema';

import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: File.name, schema: FileSchema }])],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
