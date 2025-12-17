import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { NestedInventoryItemSizeDto } from '../inventory-item-size/nested-inventory-item-size.dto';

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({
    description: 'Name of InventoryItem entity.',
    example: 'Sliced Almonds',
  })
  @IsString()
  @IsOptional()
  readonly name?: string;

  @ApiPropertyOptional({
    description: 'Id of InventoryItemCategory entity.',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly categoryId?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Id of InventoryItemVendor entity.',
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly vendorId?: number;

  @ApiPropertyOptional({
    description:
      'Mixed array of CreateInventoryItemSizeDtos and NestedUpdateInventoryItemSizeDtos.',
    type: [NestedInventoryItemSizeDto],
    example: [
      {
        mode: 'update',
        id: 1,
        updateDto: {
          measureUnitId: 1,
          measureAmount: 2,
          inventoryPackageId: 3,
          cost: 4,
        },
      },
      {
        mode: 'create',
        createDto: {
          inventoryItemId: 1,
          measureUnitId: 2,
          measureAmount: 3,
          inventoryPackageId: 4,
          cost: 5,
        },
      },
    ],
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly sizeDtos?: NestedInventoryItemSizeDto[];

  /*
  @ApiPropertyOptional({
    description: 'Price paid for the InventoryItem entity.',
    example: 5.99,
    nullable: true,
    type: 'number',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  cost?: number;*/
}
