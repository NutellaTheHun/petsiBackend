import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class UpdateInventoryItemSizeDto {
  @ApiProperty({
    description: 'Id of UnitofMeasure entity.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly measureUnitId?: number;

  @ApiProperty({
    description: 'the unit quantity of the UnitofMeasure entity.',
    example: 10,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly measureAmount?: number;

  @ApiProperty({
    description: 'Id of InventoryItemPackage entity.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly inventoryPackageId?: number;

  @ApiProperty({
    description: 'Prsice paid for the InventoryItem entity.',
    example: 3.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  cost?: number;
}
