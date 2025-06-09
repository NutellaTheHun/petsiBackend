import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';
import { InventoryItem } from '../../entities/inventory-item.entity';

/**
 * Depreciated, only created as a child through {@link InventoryItem}.
 */
export class CreateInventoryItemSizeDto {
  @ApiProperty({
    description: 'Id of InventoryItem entity.',
    type: [InventoryItem],
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly inventoryItemId: number;

  @ApiProperty({
    description: 'Id of UnitofMeasure entity.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly measureUnitId: number;

  @ApiProperty({
    description: 'the unit quantity of the UnitofMeasure entity.',
    example: 10,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly measureAmount: number;

  @ApiProperty({
    description: 'Id of InventoryItemPackage entity.',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly inventoryPackageId: number;

  @ApiProperty({
    description: 'Price paid for the InventoryItem entity.',
    example: 4.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Min(0)
  cost: number;
}
