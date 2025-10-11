import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../../schemas/user.schema';
import { File, FileDocument } from '../../schemas/file.schema';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../../config/constants';

@Injectable()
export class UploadService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(File.name) private fileModel: Model<FileDocument>
  ) {}

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File too large. Maximum size is 5MB.');
    }

    // Create file record in database
    const fileRecord = new this.fileModel({
      user: userId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      data: file.buffer,
      purpose: 'avatar',
    });

    await fileRecord.save();

    // Update user's avatar URL to point to file endpoint
    const avatarUrl = `/api/v1/files/${fileRecord._id}`;
    const user = await this.userModel.findById(userId);

    if (user) {
      await this.userModel.findByIdAndUpdate(userId, {
        avatarUrl,
        gallery: [...(user.gallery || []), avatarUrl],
      });
    }

    return {
      success: true,
      avatarUrl,
    };
  }

  async deleteAvatar(userId: string) {
    const fileRecord = await this.fileModel.findOne({
      user: userId,
    });

    if (!fileRecord) {
      throw new NotFoundException('No avatar to delete');
    }

    // Delete file record from database
    await this.fileModel.findByIdAndDelete(fileRecord._id);

    // Remove avatar URL from user
    await this.userModel.findByIdAndUpdate(userId, {
      $unset: { avatarUrl: 1 },
    });

    return {
      success: true,
      message: 'Avatar deleted successfully',
    };
  }
}
