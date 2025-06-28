import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { InventoryItemSizeUnionResolver } from '../../utils/inventory-item-size-union-resolver';
import { CreateChildInventoryItemSizeDto } from '../inventory-item-size/create-child-inventory-item-size.dto';
import { UpdateChildInventoryItemSizeDto } from '../inventory-item-size/update-child-inventory-item-size.dto';

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({
    description: 'Name of InventoryItem entity.',
    example: 'Sliced Almonds',
  })
  @IsString()
  @IsOptional()
  readonly itemName?: string;

  @ApiPropertyOptional({
    description: 'Id of InventoryItemCategory entity.',
    example: 1,
    nullable: true,
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly inventoryItemCategoryId?: number | null;

  @ApiPropertyOptional({
    example: 2,
    description: 'Id of InventoryItemVendor entity.',
    nullable: true,
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly vendorId?: number | null;

  @ApiPropertyOptional({
    description:
      'Mixed array of CreateChildInventoryItemSizeDtos and UpdateChildInventoryItemSizeDtos. Child dtos are used when creating/updating an entity through a parent (InventoryItem).',
    type: [UpdateChildInventoryItemSizeDto],
    example: [
      {
        mode: 'create',
        measureUnitId: 1,
        measureAmount: 2,
        inventoryPackageId: 3,
        cost: 4.99,
      },
      {
        mode: 'update',
        id: 5,
        measureUnitId: 6,
        measureAmount: 7,
        inventoryPackageId: 8,
        cost: 9.99,
      },
    ],
    nullable: true,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryItemSizeUnionResolver)
  readonly itemSizeDtos?: (
    | CreateChildInventoryItemSizeDto
    | UpdateChildInventoryItemSizeDto
  )[];

  @ApiPropertyOptional({
    description: 'Price paid for the InventoryItem entity.',
    example: 5.99,
    nullable: true,
    type: 'number',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  cost?: number;
}
