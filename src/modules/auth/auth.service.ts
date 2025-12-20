import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { SignUpInput, SignInInput } from '../../common/dto/validation-schemas';
import { createSuccessResponse, createErrorResponse } from '../../common/types/api-response.type';
import { User, UserDocument } from '../../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async signUp(data: SignUpInput) {
    // Check if user already exists
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

    // Create new user
    const user = new this.userModel({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    await user.save();

    // Return success response (without password)
    const userData = {
      id: (user._id as any).toString(),
      name: user.name,
      email: user.email,
      apiKey: user.apiKey,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt.toISOString(),
    };

    return createSuccessResponse('User created successfully', userData);
  }

  async signIn(data: SignInInput) {
    // Find user by email
    const user = await this.userModel.findOne({ email: data.email }).select('+password');
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      apiKey: user.apiKey,
    };

    return createSuccessResponse('Login successful', userData);
  }

  async logout() {
    return createSuccessResponse('Logged out successfully', {});
  }
}
