import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class UpdateChildInventoryItemSizeDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating an InventoryItem entity.',
    example: 'update',
  })
  @IsNotEmpty()
  readonly mode: 'update' = 'update';

  @ApiProperty({
    description: 'Id of InventoryItemSize entity to be updated.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly id: number;

  @ApiProperty({
    description: 'Id of UnitofMeasure entity.',
    example: 2,
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
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly inventoryPackageId?: number;

  @ApiProperty({
    description: 'Price paid for the InventoryItem entity.',
    example: 4.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  cost?: number;
}
