import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateInventoryItemSizeDto } from '../inventory-item-size/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../inventory-item-size/update-inventory-item-size.dto';

export class NestedUpdateInventoryItemSizeDto {
  @ApiProperty({
    description: 'Id of InventoryItemSize entity.',
    example: 1,
  })
  @IsNumber()
  readonly id: number;

  @ApiProperty({
    description: 'UpdateInventoryItemSizeDto for InventoryItemSize entity.',
    type: UpdateInventoryItemSizeDto,
    example: {
      measureUnitId: 1,
      measureAmount: 10,
      inventoryPackageId: 1,
      cost: 100,
    },
  })
  @ValidateNested()
  readonly dto: UpdateInventoryItemSizeDto;
}

export class NestedInventoryItemSizeDto {
  @ApiProperty({
    description: 'CreateInventoryItemSizeDto for InventoryItemSize entity.',
    type: CreateInventoryItemSizeDto,
    example: {
      measureUnitId: 1,
      measureAmount: 10,
      inventoryPackageId: 1,
      cost: 100,
    },
  })
  @IsNumber()
  readonly create?: CreateInventoryItemSizeDto;

  @ApiProperty({
    description: 'UpdateInventoryItemSizeDto for InventoryItemSize entity.',
    type: NestedUpdateInventoryItemSizeDto,
    example: {
      measureUnitId: 1,
      measureAmount: 10,
      inventoryPackageId: 1,
      cost: 100,
    },
  })
  @IsNumber()
  readonly update?: NestedUpdateInventoryItemSizeDto;
}

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
      'Mixed array of CreateInventoryItemSizeDtos and NestedUpdateInventoryItemSizeDtos.',
    type: [NestedInventoryItemSizeDto],
    example: [
      {
        createDto: {
          measureUnitId: 1,
          measureAmount: 10,
          inventoryPackageId: 1,
          cost: 100,
        },
        updateDto: {
          id: 1,
          dto: {
            measureUnitId: 6,
            measureAmount: 7,
            inventoryPackageId: 8,
            cost: 9.99,
          },
        },
      },
    ],
    nullable: true,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly itemSizeDtos?: NestedInventoryItemSizeDto[];

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
