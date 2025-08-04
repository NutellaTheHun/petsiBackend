import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateInventoryItemSizeDto {
  @ApiProperty({
    description:
      'Id of InventoryItem entity. Is required if sending DTO to inventory-item-size endpoint. Is not required if sending DTO as a nested dto of a create inventory-item request.',
    //type: InventoryItem,
    example: 1,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly inventoryItemId?: number;

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
