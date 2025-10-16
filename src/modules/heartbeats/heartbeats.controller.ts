import { Controller, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { parseOrThrow } from '@/common/utils/validation.utils';
import { HeartbeatsSchema } from '@/common/dto/validation-schemas';
import { AuthenticatedUser } from '@/common/types/authenticated-user';

import { HeartbeatsService } from './heartbeats.service';

@ApiTags('heartbeats')
@ApiBearerAuth('bearer')
@Controller('heartbeats')
@UseGuards(ApiKeyGuard)
export class HeartbeatsController {
  constructor(private readonly heartbeatsService: HeartbeatsService) {}

  @Post()
  async saveHeartbeats(@CurrentUser() user: AuthenticatedUser, @Body() body: any) {
    try {
      const validatedData = parseOrThrow<any>(HeartbeatsSchema, body);
      return await this.heartbeatsService.saveHeartbeats(user._id, validatedData);
    } catch (error: any) {
      console.error('Error processing heartbeats:', error);

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

      throw new HttpException(
        { success: false, error: 'Failed to save heartbeats' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
