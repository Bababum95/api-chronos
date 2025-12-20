import { Controller, Get, Put, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UpdateProfileSchema, ChangePasswordSchema } from '@/common/dto/validation-schemas';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { AuthenticatedUser } from '@/common/types/authenticated-user';
import { parseOrThrow } from '@/common/utils/validation.utils';

import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
@UseGuards(ApiKeyGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return await this.usersService.getProfile(user._id);
  }

  @Put('me')
  async updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() body: any) {
    try {
      const validatedData = parseOrThrow<any>(UpdateProfileSchema, body);
      return await this.usersService.updateProfile(user._id, validatedData);
    } catch (error: any) {
      if (error.message === 'ValidationError') {
        throw new HttpException(
          {
            success: false,
            message: 'Validation failed',
            errors: error.details,
          },
          HttpStatus.BAD_REQUEST
        );
      }
      throw error;
    }
  }

  @Put('me/password')
  async changePassword(@CurrentUser() user: AuthenticatedUser, @Body() body: any) {
    try {
      const validatedData = parseOrThrow<any>(ChangePasswordSchema, body);
      return await this.usersService.changePassword(user._id, validatedData);
    } catch (error: any) {
      if (error.message === 'ValidationError') {
        throw new HttpException(
          {
            success: false,
            message: 'Validation failed',
            errors: error.details,
          },
          HttpStatus.BAD_REQUEST
        );
      }
      throw error;
    }
  }
}
