import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateChildInventoryItemSizeDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating an InventoryItem entity.',
    example: 'create',
  })
  @IsNotEmpty()
  readonly mode: 'create' = 'create';

  @ApiProperty({
    description: 'Id of UnitofMeasure entity.',
    example: 1,
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
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly inventoryPackageId: number;

  @ApiProperty({
    description: 'Price paid for the InventoryItem entity.',
    example: 3.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  cost?: number;
}
