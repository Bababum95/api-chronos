import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiTags } from '@nestjs/swagger';
import { Connection } from 'mongoose';

@ApiTags('ping')
@Controller('ping')
export class PingController {
  constructor(@InjectConnection() private connection: Connection) {}

  @Get()
  async ping() {
    try {
      const status = this.connection.readyState;
      return { status, message: 'Connected' };
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}
