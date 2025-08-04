import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, ValidateNested } from 'class-validator';
import { CreateInventoryAreaItemDto } from './create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from './update-inventory-area-item.dto';

export class NestedInventoryAreaItemDto {
  /*@ApiPropertyOptional({
    description: 'CreateInventoryAreaItemDto for InventoryAreaItem entity.',
    type: CreateInventoryAreaItemDto,
    example: {
      measureUnitId: 4,
      measureAmount: 5,
      inventoryPackageId: 6,
      cost: 7.99,
    },
  })
  @ValidateNested()
  readonly create?: CreateInventoryAreaItemDto;

  @ApiPropertyOptional({
    description: 'UpdateInventoryAreaItemDto for InventoryAreaItem entity.',
    type: UpdateInventoryAreaItemDto,
    example: {
      id: 1,
      dto: {
        measureUnitId: 4,
        measureAmount: 5,
        inventoryPackageId: 6,
        cost: 7.99,
      },
    },
  })
  @ValidateNested()
  readonly update?: NestedUpdateInventoryAreaItemDto;*/

  @ApiProperty({
    description: 'Determines if this dto is to update or create a resource',
    example: 'create',
  })
  readonly mode: 'create' | 'update';

  @ApiProperty({
    description: 'Id for InventoryAreaItem entity.',
    example: 1,
  })
  @IsNumber()
  readonly id?: number;

  @ApiPropertyOptional({
    description: 'CreateInventoryAreaItemDto for InventoryAreaItem entity.',
    type: CreateInventoryAreaItemDto,
    example: {
      measureUnitId: 4,
      measureAmount: 5,
      inventoryPackageId: 6,
      cost: 7.99,
    },
  })
  @ValidateNested()
  readonly createDto?: CreateInventoryAreaItemDto;

  @ApiPropertyOptional({
    description: 'UpdateInventoryAreaItemDto for InventoryAreaItem entity.',
    type: UpdateInventoryAreaItemDto,
    example: {
      measureUnitId: 4,
      measureAmount: 5,
      inventoryPackageId: 6,
      cost: 7.99,
    },
  })
  @ValidateNested()
  readonly updateDto?: UpdateInventoryAreaItemDto;
}
