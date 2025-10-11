import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from '@/schemas/user.schema';

@Injectable()
export class CopyService {
  constructor(
    @InjectModel('OldUser', 'sourceConnection')
    private readonly oldUserModel: Model<User>,
    @InjectModel('NewUser')
    private readonly newUserModel: Model<User>
  ) {}

  /** Copies users from old MongoDB database into the new one. */
  async copyUsersToNewDb() {
    console.log('📦 Fetching users from old database...');
    const oldUsers = await this.oldUserModel.find().lean();

    if (!oldUsers.length) {
      console.log('⚠️  No users found in old database.');
      return { copied: 0 };
    }

    console.log(`🔄 Found ${oldUsers.length} users. Copying...`);
    await this.newUserModel.insertMany(oldUsers);

    console.log('✅ Copy completed successfully.');
    return { copied: oldUsers.length };
  }
}
