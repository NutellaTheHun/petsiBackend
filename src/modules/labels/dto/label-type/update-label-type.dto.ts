import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateLabelTypeDto {
  @ApiProperty({ description: 'Name of the LabelType entity.', example: '2x1' })
  @IsString()
  @IsOptional()
  readonly labelTypeName?: string;

  @ApiProperty({
    description: 'The length of the label type in hundreths of an inch',
    example: 200,
  })
  @IsNumber()
  @IsOptional()
  readonly labelTypeLength?: number;

  @ApiProperty({
    description: 'The length of the label type in hundreths of an inch',
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  readonly labelTypeWidth?: number;
}
