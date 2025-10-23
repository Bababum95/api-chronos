import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

/**
 * DTO for filtering and paginating projects for select dropdown
 */
export class FindProjectsForSelectQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 20;

  @ApiPropertyOptional({
    description: 'Return only root-level projects (no parent)',
    example: true,
    type: Boolean,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  root = true;

  @ApiPropertyOptional({
    description: 'Include archived projects in the response',
    example: false,
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  archived = false;
}