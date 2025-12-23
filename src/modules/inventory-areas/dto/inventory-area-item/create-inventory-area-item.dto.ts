import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { NestedInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/nested-inventory-item-size.dto';
import { InventoryItemSize } from '../../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { InventoryAreaCount } from '../../entities/inventory-area-count.entity';

export class CreateInventoryAreaItemDto {
  @ApiProperty({
    description: 'Id for InventoryItem entity.',
    example: 2,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly countedInventoryItemId: EntityId<InventoryItem>;

  @ApiProperty({
    description: 'The amount of InventoryItem per unit.',
    example: 6,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly amount: number;

  @ApiProperty({
    description:
      'Id for InventoryItemSize entity. If countedItemSizeId is null, countedItemSizeDto must be populated.',
    example: 3,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedItemSizeId?: EntityId<InventoryItemSize>;

  @ApiProperty({
    description:
      'Is optional, if countedItemSizeDto is null, countedItemSizeId must be populated.',
    type: NestedInventoryItemSizeDto,
    required: false,
    example: {
      mode: 'create',
      createId: 1,
      createDto: {
        measureTypeId: 2,
        measureAmount: 3,
        packageId: 4,
        cost: 5.99,
      },
    },
  })
  @IsOptional()
  readonly countedItemSize?: NestedInventoryItemSizeDto;

  @ApiProperty({
    description:
      'Id for InventoryAreaCount entity. Is required if sending DTO to inventory-area-item endpoint. Is not required if sending DTO as a nested dto of a create inventory-area-count request.',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly parentInventoryCountId?: EntityId<InventoryAreaCount>;
}
