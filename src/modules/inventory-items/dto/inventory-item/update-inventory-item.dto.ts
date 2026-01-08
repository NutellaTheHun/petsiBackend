import { ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import {
    IsArray,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    ValidateNested,
} from 'class-validator';
import { EntityId } from '../../../../common/types';
import { InventoryItemCategory } from '../../entities/inventory-item-category.entity';
import { InventoryItemVendor } from '../../entities/inventory-item-vendor.entity';
import { NestedCreateInventoryItemSizeDto } from '../inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../inventory-item-size/nested-update-inventory-item-size.dto';

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
  readonly categoryId?: EntityId<InventoryItemCategory>;

  @ApiPropertyOptional({
    example: 2,
    description: 'Id of InventoryItemVendor entity.',
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly vendorId?: EntityId<InventoryItemVendor>;

  @ApiPropertyOptional({
    description:
      'Mixed array of CreateInventoryItemSizeDtos and NestedUpdateInventoryItemSizeDtos.',
    //type: [NestedInventoryItemSizeDto],
    oneOf: [
        { $ref: getSchemaPath(NestedCreateInventoryItemSizeDto)},
        { $ref: getSchemaPath(NestedUpdateInventoryItemSizeDto)},
    ],
    example: [
      {
        mode: 'update',
        id: 1,
        updateDto: {
          measureTypeId: 2,
          measureAmount: 3,
          packageId: 4,
          cost: 5.99,
        },
      },
      {
        mode: 'create',
        createId: 'c6',
        createDto: {
          inventoryItemId: 7,
          measureTypeId: 8,
          measureAmount: 9,
          packageId: 10,
          cost: 11.99,
        },
      },
    ],
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly sizes?: (NestedCreateInventoryItemSizeDto | NestedUpdateInventoryItemSizeDto)[];
}
