import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateInventoryItemCategoryDto {
  @ApiPropertyOptional({
    example: 'Dry Goods',
    description: 'Name of InventoryItemCategory entity.',
  })
  @IsString()
  @IsOptional()
  readonly itemCategoryName?: string;
}
