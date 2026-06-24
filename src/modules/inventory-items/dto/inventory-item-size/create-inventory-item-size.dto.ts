import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { AppUnit, UNITS } from '../../../../common/units';
import { EntityId } from '../../../../common/types';
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
    readonly inventoryItemId: EntityId<InventoryItem>;

    @ApiProperty({
        description: 'Id of InventoryItemPackage entity.',
        example: 3,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly packageId: EntityId<InventoryItemPackage>;

    @ApiProperty({
        description: 'Unit symbol for this size (e.g. "lb", "oz", "ea").',
        example: 'lb',
    })
    @IsIn(Object.values(UNITS))
    @IsNotEmpty()
    readonly unit: AppUnit;

    @ApiProperty({
        description: 'the unit quantity of the unit entity.',
        example: 10,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly measureAmount: number;

    @ApiProperty({
        description: 'Price paid for the InventoryItem entity.',
        example: 4.99,
        nullable: true,
    })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Min(0)
    readonly cost?: number | null;
}
