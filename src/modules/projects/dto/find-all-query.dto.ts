import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

/**
 * DTO for filtering and paginating projects list
 */
export class FindAllProjectsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (0 = no limit)',
    example: 20,
    minimum: 0,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 0))
  @IsInt()
  @Min(0)
  limit = 0;

  @ApiPropertyOptional({
    description: 'Return only root-level projects (no parent)',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    }
    return Boolean(value);
  })
  @IsBoolean()
  root?: boolean;
}
