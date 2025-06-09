import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateInventoryAreaDto {
  @ApiProperty({
    description: 'Name of the InventoryArea.',
    example: 'Dry Storage',
  })
  @IsString()
  @IsOptional()
  readonly areaName?: string;
}
