import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { File, FileDocument } from '../../schemas/file.schema';

@Injectable()
export class FilesService {
  constructor(@InjectModel(File.name) private fileModel: Model<FileDocument>) {}

  async getFile(id: string) {
    try {
      const fileId = new Types.ObjectId(id);
      const fileRecord = await this.fileModel.findById(fileId);

      if (!fileRecord) {
        throw new NotFoundException('File not found');
      }

      return fileRecord;
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }
}
