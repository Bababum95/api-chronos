import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { z } from 'zod';

import { User, UserDocument } from '../../schemas/user.schema';
import { parseOrThrow } from '../utils/validation.utils';
import { extractBasicApiKey } from '../utils/auth-header.utils';

const ApiKeySchema = z.object({
  apiKey: z
    .string()
    .min(1, 'API key is required')
    .regex(
      /^(chronos_)?[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
      'Invalid API key format'
    ),
});

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = extractBasicApiKey(request.headers['authorization']);

    if (!apiKey) {
      throw new NotFoundException('API key is required');
    }

    // Validate API key format
    try {
      parseOrThrow(ApiKeySchema, { apiKey });
    } catch (error) {
      if (error instanceof Error && error.message === 'ValidationError') {
        const details = (error as any).details;
        throw new UnauthorizedException({
          success: false,
          message: 'Invalid API key format',
          errors: details,
        });
      }
      throw error;
    }

    // Find user by API key
    const user = await this.userModel.findOne({ apiKey }).lean().exec();

    if (!user) {
      throw new NotFoundException('User not found with this API key');
    }

    request.user = { ...user, _id: user._id.toString() };
    return true;
  }
}
