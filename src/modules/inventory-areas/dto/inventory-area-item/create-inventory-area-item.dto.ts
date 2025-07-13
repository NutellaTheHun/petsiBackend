import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { CreateInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/create-inventory-item-size.dto';
import { InventoryAreaCount } from '../../entities/inventory-area-count.entity';

/**
 * Depreciated, only created as a child through {@link InventoryAreaCount}.
 */
export class CreateInventoryAreaItemDto {
  @ApiProperty({
    description: 'Id for InventoryAreaCount entity.',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly parentInventoryCountId: number;

  @ApiProperty({
    description: 'Id for InventoryItem entity.',
    example: 2,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly countedInventoryItemId: number;

  @ApiProperty({
    description: 'The amount of InventoryItem per unit.',
    example: 6,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedAmount?: number;

  @ApiProperty({
    description:
      'Id for InventoryItemSize entity. If countedItemSizeId is null, countedItemSizeDto must be populated.',
    example: 3,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedItemSizeId?: number;

  @ApiProperty({
    description:
      'Is optional, if countedItemSizeDto is null, countedItemSizeId must be populated.',
    type: CreateInventoryItemSizeDto,
    example: {
      mode: 'create',
      measureUnitId: 1,
      measureAmount: 2,
      inventoryPackageId: 3,
      cost: 4.99,
    },
  })
  @IsOptional()
  readonly countedItemSizeDto?: CreateInventoryItemSizeDto;
}
