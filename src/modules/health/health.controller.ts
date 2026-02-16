import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * Health check response shape for load balancers and monitoring
 */
type HealthResponse = {
  status: 'ok';
  timestamp: string;
};

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  health(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
