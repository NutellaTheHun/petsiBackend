import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { CreateInventoryItemSizeDto } from '../inventory-item-size/create-inventory-item-size.dto';

export class CreateInventoryItemDto {
  @ApiProperty({
    description: 'Name of InventoryItem entity.',
    example: 'Evaporated Milk',
  })
  @IsString()
  @IsNotEmpty()
  readonly itemName: string;

  @ApiPropertyOptional({
    description: 'Id of InventoryItemCategory entity.',
    example: 1,
    nullable: true,
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly inventoryItemCategoryId?: number;

  @ApiPropertyOptional({
    description: 'Id of InventoryItemVendor entity.',
    example: 2,
    nullable: true,
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly vendorId?: number;

  @ApiPropertyOptional({
    description:
      'Child dtos are used when creating/updating an entity through a parent (InventoryItem).',
    type: [CreateInventoryItemSizeDto],
    example: [
      {
        measureUnitId: 1,
        measureAmount: 2,
        inventoryPackageId: 3,
        cost: 4.99,
      },
    ],
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  readonly itemSizeDtos?: CreateInventoryItemSizeDto[];
}
