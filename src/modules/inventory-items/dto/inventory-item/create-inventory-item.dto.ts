import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { CreateChildInventoryItemSizeDto } from '../inventory-item-size/create-child-inventory-item-size.dto';

export class CreateInventoryItemDto {
  @ApiProperty({
    description: 'Name of InventoryItem entity.',
    example: 'Evaporated Milk',
  })
  @IsString()
  @IsNotEmpty()
  readonly itemName: string;

  @ApiProperty({
    description: 'Id of InventoryItemCategory entity.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly inventoryItemCategoryId?: number;

  @ApiProperty({
    description: 'Id of InventoryItemVendor entity.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly vendorId?: number;

  @ApiProperty({
    description:
      'Child dtos are used when creating/updating an entity through a parent (InventoryItem).',
    type: [CreateChildInventoryItemSizeDto],
    example: [
      {
        mode: 'create',
        measureUnitId: 1,
        measureAmount: 2,
        inventoryPackageId: 3,
        cost: 4.99,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  readonly itemSizeDtos?: CreateChildInventoryItemSizeDto[];
}
