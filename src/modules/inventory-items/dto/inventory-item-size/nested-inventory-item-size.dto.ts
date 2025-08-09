import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateInventoryItemSizeDto } from './create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from './update-inventory-item-size.dto';

export class NestedInventoryItemSizeDto {
  @ApiProperty({
    description: 'Determines if this dto is to update or create a resource',
    example: 'update',
    enum: ['create', 'update'],
  })
  @IsNotEmpty()
  readonly mode: 'create' | 'update';

  @ApiPropertyOptional({
    description: 'Id for InventoryItemSize entity when updating',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  readonly id?: number;

  @ApiPropertyOptional({
    description: 'CreateInventoryItemSizeDto for InventoryItemSize entity.',
    type: CreateInventoryItemSizeDto,
    example: {
      measureUnitId: 1,
      measureAmount: 10,
      inventoryPackageId: 1,
      cost: 100,
    },
  })
  @ValidateNested()
  @IsOptional()
  readonly createDto?: CreateInventoryItemSizeDto;

  @ApiPropertyOptional({
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
  @IsOptional()
  readonly updateDto?: UpdateInventoryItemSizeDto;
}
