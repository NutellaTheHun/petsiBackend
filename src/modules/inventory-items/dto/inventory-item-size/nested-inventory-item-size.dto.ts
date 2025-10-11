import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { NestedDtoBase } from '../../../../base/nested-dto-base';
import { CreateInventoryItemSizeDto } from './create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from './update-inventory-item-size.dto';

export class NestedInventoryItemSizeDto extends NestedDtoBase<
  CreateInventoryItemSizeDto,
  UpdateInventoryItemSizeDto
> {
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
