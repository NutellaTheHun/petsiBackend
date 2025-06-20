import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateInventoryAreaDto {
  @ApiPropertyOptional({
    description: 'Name of the InventoryArea.',
    example: 'Dry Storage',
  })
  @IsString()
  @IsOptional()
  readonly areaName?: string;
}
