import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import { InventoryItemPackage } from '../../entities/inventory-item-package.entity';

export class UpdateInventoryItemSizeDto {
  @ApiPropertyOptional({
    description: 'Id of InventoryItemPackage entity.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly packageId?: EntityId<InventoryItemPackage>;

  @ApiPropertyOptional({
    description: 'Id of UnitofMeasure entity.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly measureTypeId?: EntityId<UnitOfMeasure>;

  @ApiPropertyOptional({
    description: 'the unit quantity of the UnitofMeasure entity.',
    example: 10,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly measureAmount?: number;

  @ApiPropertyOptional({
    description: 'Prsice paid for the InventoryItem entity.',
    example: 3.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  readonly cost?: number;
}
