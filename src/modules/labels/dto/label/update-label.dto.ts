import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateLabelDto {
  @ApiProperty({
    description: 'Id of MenuItem entity.',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly menuItemId?: number;

  @ApiProperty({
    description: 'URL to image on offsite storage.',
    example: 'url/image.com',
  })
  @IsString()
  @IsOptional()
  readonly imageUrl?: string;

  @ApiProperty({
    description: 'Id of LabelType entity.',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly labelTypeId?: number;
}
