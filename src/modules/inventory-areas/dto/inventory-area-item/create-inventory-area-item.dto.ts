import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { CreateInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/create-inventory-item-size.dto';

export class CreateInventoryAreaItemDto {
  @ApiProperty({
    description:
      'Id for InventoryAreaCount entity. Is required if sending DTO to inventory-area-item endpoint. Is not required if sending DTO as a nested dto of a create inventory-area-count request.',
    example: 1,
    type: Number,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly parentInventoryCountId?: number;

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
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedAmount: number;

  @ApiProperty({
    description:
      'Id for InventoryItemSize entity. If countedItemSizeId is null, countedItemSizeDto must be populated.',
    example: 3,
    type: Number,
    nullable: true,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedItemSizeId?: number | null;

  @ApiProperty({
    description:
      'Is optional, if countedItemSizeDto is null, countedItemSizeId must be populated.',
    type: CreateInventoryItemSizeDto,
    example: {
      measureUnitId: 1,
      measureAmount: 2,
      inventoryPackageId: 3,
      cost: 4.99,
    },
    nullable: true,
  })
  @IsOptional()
  readonly countedItemSizeDto?: CreateInventoryItemSizeDto | null;
}
