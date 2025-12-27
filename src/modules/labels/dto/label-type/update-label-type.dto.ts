import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateLabelTypeDto {
  @ApiPropertyOptional({
    description: 'Name of the LabelType entity.',
    example: '2x1',
  })
  @IsString()
  @IsOptional()
  readonly name?: string;

  @ApiPropertyOptional({
    description: 'The length of the label type in hundreths of an inch',
    example: 200,
  })
  @IsNumber()
  @IsOptional()
  readonly length?: number;

  @ApiPropertyOptional({
    description: 'The length of the label type in hundreths of an inch',
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  readonly width?: number;
}
