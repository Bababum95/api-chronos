import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({ description: 'Marks project as favorite', example: false })
  @IsOptional()
  @IsBoolean()
  is_favorite?: boolean;

  @ApiPropertyOptional({ description: 'Marks project as archived', example: false })
  @IsOptional()
  @IsBoolean()
  is_archived?: boolean;
}
