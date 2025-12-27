import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import { InventoryItemPackage } from '../../entities/inventory-item-package.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';

export class CreateInventoryItemSizeDto {
  @ApiProperty({
    description:
      'Id of InventoryItem entity. Is required if sending DTO to inventory-item-size endpoint. Is not required if sending DTO as a nested dto of a create inventory-item request.',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly inventoryItemId?: EntityId<InventoryItem>;

  @ApiProperty({
    description: 'Id of InventoryItemPackage entity.',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly packageId: EntityId<InventoryItemPackage>;

  @ApiProperty({
    description: 'Id of UnitofMeasure entity.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly measureTypeId: EntityId<UnitOfMeasure>;

  @ApiProperty({
    description: 'the unit quantity of the UnitofMeasure entity.',
    example: 10,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly measureAmount: number;

  @ApiProperty({
    description: 'Price paid for the InventoryItem entity.',
    example: 4.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Min(0)
  readonly cost: number;
}
