import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsOptional, IsString, MinLength, ArrayNotEmpty, ArrayUnique } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: 'Absolute or relative path to the project folder' })
  @IsString()
  @MinLength(1)
  project_folder!: string;

  @ApiPropertyOptional({ type: [String], description: 'List of Git branches to track' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  git_branches?: string[];

  @ApiPropertyOptional({ description: 'Alternate project identifier' })
  @IsOptional()
  @IsString()
  alternate_project?: string;

  @ApiPropertyOptional({ description: 'Parent project id' })
  @IsOptional()
  @IsMongoId()
  parent?: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Human-friendly project name' })
  @IsString()
  @MinLength(1)
  name!: string;
}
