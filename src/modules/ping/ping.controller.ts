import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('ping')
export class PingController {
  constructor(@InjectConnection() private connection: Connection) {}

  @Get()
  async ping() {
    try {
      const status = this.connection.readyState;
      return { status, message: 'Connected' };
    } catch (error) {
      console.log('Error:', error);
      throw error;
    }
  }
}
