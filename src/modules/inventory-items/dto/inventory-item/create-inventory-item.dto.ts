import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { EntityId } from '../../../../common/types';
import { InventoryItemCategory } from '../../entities/inventory-item-category.entity';
import { InventoryItemVendor } from '../../entities/inventory-item-vendor.entity';
import { NestedInventoryItemSizeDto } from '../inventory-item-size/nested-inventory-item-size.dto';

export class CreateInventoryItemDto {
  @ApiProperty({
    description: 'Name of InventoryItem entity.',
    example: 'Evaporated Milk',
  })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

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
    description: 'Id of InventoryItemVendor entity.',
    example: 2,
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly vendorId?: EntityId<InventoryItemVendor>;

  @ApiPropertyOptional({
    description:
      'Child dtos are used when creating/updating an entity through a parent (InventoryItem).',
    type: [NestedInventoryItemSizeDto],
    example: [
      {
        mode: 'create',
        createDto: {
          measureUnitId: 1,
          measureAmount: 2,
          inventoryPackageId: 3,
          cost: 4.99,
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  readonly sizes?: NestedInventoryItemSizeDto[];
}
