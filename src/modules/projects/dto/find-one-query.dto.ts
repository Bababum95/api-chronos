import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

import { HOUR } from '@/config/constants';

export class FindOneProjectQueryDto {
  @ApiPropertyOptional({
    description: 'Start time as UNIX timestamp (seconds since epoch)',
    example: 1760720400,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  start!: number;

  @ApiPropertyOptional({
    description: 'End time as UNIX timestamp (seconds since epoch)',
    example: 1760757808,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  end!: number;

  @ApiPropertyOptional({
    description: 'Interval duration in seconds',
    example: HOUR,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  interval?: number;
}
