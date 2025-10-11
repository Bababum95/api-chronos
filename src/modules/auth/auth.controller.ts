import { Controller, Post, Body, HttpStatus, HttpException, HttpCode, Res } from '@nestjs/common';
import { Response } from 'express';

import { parseOrThrow } from '../../common/utils/validation.utils';
import { SignUpSchema, SignInSchema } from '../../common/dto/validation-schemas';

import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() body: any) {
    try {
      const validatedData = parseOrThrow<any>(SignUpSchema, body);
      return await this.authService.signUp(validatedData);
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

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() body: any) {
    try {
      const validatedData = parseOrThrow<any>(SignInSchema, body);
      return await this.authService.signIn(validatedData);
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

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth-token');
    return await this.authService.logout();
  }
}
