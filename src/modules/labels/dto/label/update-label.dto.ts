import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateLabelDto {
  @ApiPropertyOptional({
    description: 'Id of MenuItem entity.',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly menuItemId?: number;

  @ApiPropertyOptional({
    description: 'URL to image on offsite storage.',
    example: 'url/image.com',
  })
  @IsString()
  @IsOptional()
  readonly imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Id of LabelType entity.',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly labelTypeId?: number;
}
