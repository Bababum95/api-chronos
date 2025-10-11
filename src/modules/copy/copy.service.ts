import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Logger } from '@nestjs/common';

import { User } from '@/schemas/user.schema';
import { File } from '@/schemas/file.schema';
import { Heartbeat } from '@/schemas/heartbeat.schema';

@Injectable()
export class CopyService {
  private readonly logger = new Logger(CopyService.name);

  constructor(
    @InjectModel('OldUser', 'sourceConnection')
    private readonly oldUserModel: Model<User>,
    @InjectModel('NewUser')
    private readonly newUserModel: Model<User>,

    @InjectModel('OldFile', 'sourceConnection')
    private readonly oldFileModel: Model<File>,
    @InjectModel('NewFile')
    private readonly newFileModel: Model<File>,

    @InjectModel('OldHeartbeat', 'sourceConnection')
    private readonly oldHeartbeatModel: Model<Heartbeat>,
    @InjectModel('NewHeartbeat')
    private readonly newHeartbeatModel: Model<Heartbeat>
  ) {}

  /** Copies users from old MongoDB database into the new one. */
  async copyUsersToNewDb() {
    this.logger.log('📦 Fetching users from old database...');
    const oldUsers = await this.oldUserModel.find().lean();

    if (!oldUsers.length) {
      this.logger.log('⚠️  No users found in old database.');
      return { copied: 0 };
    }

    this.logger.log(`🔄 Found ${oldUsers.length} users. Copying...`);
    await this.newUserModel.insertMany(oldUsers);

    this.logger.log('✅ Copy completed successfully.');
    return { copied: oldUsers.length };
  }

  /** Copies files from old MongoDB database into the new one. */
  async copyFilesToNewDb() {
    this.logger.log('📦 Fetching files from old database...');
    const oldFiles = await this.oldFileModel.find().lean();

    if (!oldFiles.length) {
      this.logger.log('⚠️  No files found in old database.');
      return { copied: 0 };
    }

    this.logger.log(`🔄 Found ${oldFiles.length} files. Copying...`);
    await this.newFileModel.insertMany(oldFiles);

    this.logger.log('✅ File copy completed successfully.');
    return { copied: oldFiles.length };
  }

  async copyHeartbeatsToNewDb() {
    this.logger.log('📦 Starting heartbeat copy from old database...');
    const batchSize = 1000;
    let totalCopied = 0;
    let batchNumber = 0;

    while (true) {
      const heartbeats = await this.oldHeartbeatModel
        .find({
          project_folder: { $ne: 'swagger/api-docs' },
          user: { $exists: true, $ne: null },
        })
        .skip(batchNumber * batchSize)
        .limit(batchSize)
        .lean();

      if (heartbeats.length === 0) break;

      const operations = heartbeats.map((hb) => ({
        updateOne: {
          filter: { _id: hb._id },
          update: { $set: hb },
          upsert: true,
        },
      }));

      await this.newHeartbeatModel.bulkWrite(operations);

      totalCopied += heartbeats.length;
      batchNumber++;

      this.logger.log(`🔄 Batch ${batchNumber}: Upserted ${heartbeats.length} heartbeats...`);
    }

    this.logger.log(`✅ Heartbeat copy completed successfully. Total copied: ${totalCopied}`);
    return { copied: totalCopied };
  }
}
