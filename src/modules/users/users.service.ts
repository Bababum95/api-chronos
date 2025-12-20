import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UpdateProfileInput, ChangePasswordInput } from '@/common/dto/validation-schemas';
import { createSuccessResponse, createErrorResponse } from '@/common/types/api-response.type';
import { User, UserDocument } from '@/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return createSuccessResponse('User fetched successfully', user);
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    // Check if email is being changed and if it already exists
    if (data.email) {
      const currentUser = await this.userModel.findById(userId);
      if (currentUser && data.email !== currentUser.email) {
        const existingUser = await this.userModel.findOne({ email: data.email });
        if (existingUser) {
          throw new ConflictException(
            createErrorResponse('User with this email already exists', [
              {
                path: 'email',
                message: 'User with this email already exists',
                field: 'email',
              },
            ])
          );
        }
      }
    }

    // Update user profile
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
        },
        { new: true, select: '-password' }
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return createSuccessResponse('Profile updated successfully', updatedUser);
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    // Get user with password for verification
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(data.currentPassword);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException(
        createErrorResponse('Current password is incorrect', [
          {
            path: 'currentPassword',
            message: 'Current password is incorrect',
            field: 'currentPassword',
          },
        ])
      );
    }

    // Check if new password is different from current password
    const isSamePassword = await user.comparePassword(data.newPassword);
    if (isSamePassword) {
      throw new BadRequestException(
        createErrorResponse('New password must be different from current password', [
          {
            path: 'newPassword',
            message: 'New password must be different from current password',
            field: 'newPassword',
          },
        ])
      );
    }

    // Update password
    user.password = data.newPassword;
    await user.save();

    return createSuccessResponse('Password changed successfully', {});
  }
}
