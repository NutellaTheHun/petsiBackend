import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';
import { NestedCreateDto } from '../../../../common/base/nested-create-dto.base';
import { EntityId } from '../../../../common/types';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import { InventoryItemPackage } from '../../entities/inventory-item-package.entity';

export class NestedCreateInventoryItemSizeDto extends NestedCreateDto {
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
