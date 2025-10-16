import {
  Controller,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/common/types/authenticated-user';

import { UploadService } from './upload.service';

@ApiTags('upload')
@ApiBearerAuth('bearer')
@Controller('upload')
@UseGuards(ApiKeyGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File
  ) {
    try {
      return await this.uploadService.uploadAvatar(user._id, file);
    } catch (error: any) {
      console.error('Avatar upload error:', error);

      throw new HttpException(
        { success: false, error: error.message || 'Internal server error' },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('avatar/delete')
  async deleteAvatar(@CurrentUser() user: AuthenticatedUser) {
    try {
      return await this.uploadService.deleteAvatar(user._id);
    } catch (error: any) {
      console.error('Error processing avatar deletion:', error);

      throw new HttpException(
        { success: false, error: error.message || 'Failed to delete avatar' },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
