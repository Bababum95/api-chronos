import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES, API_PREFIX } from '@/config/constants';
import { File, FileDocument } from '@/schemas/file.schema';
import { User, UserDocument } from '@/schemas/user.schema';

@Injectable()
export class UploadService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    private readonly configService: ConfigService
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

    const userObjectId = new Types.ObjectId(userId);

    // Create file record in database
    const fileRecord = new this.fileModel({
      user: userObjectId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      data: file.buffer,
      purpose: 'avatar',
    });

    await fileRecord.save();

    // Update user's avatar URL to point to file endpoint
    const appUrl = this.configService.get<string>('APP_URL');
    const avatarUrl = `${appUrl}/${API_PREFIX}/files/${fileRecord._id}`;
    const user = await this.userModel.findById(userObjectId);

    if (user) {
      await this.userModel.findByIdAndUpdate(userObjectId, {
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
    const userObjectId = new Types.ObjectId(userId);

    const fileRecord = await this.fileModel.findOne({
      user: userObjectId,
    });

    if (!fileRecord) {
      throw new NotFoundException('No avatar to delete');
    }

    // Delete file record from database
    await this.fileModel.findByIdAndDelete(fileRecord._id);

    // Remove avatar URL from user
    await this.userModel.findByIdAndUpdate(userObjectId, {
      $unset: { avatarUrl: 1 },
    });

    return {
      success: true,
      message: 'Avatar deleted successfully',
    };
  }
}
