import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { NestedCreateDto } from '../../../../common/base/nested-create-dto.base';
import { AppUnit, UNITS } from '../../../../common/units';
import { EntityId } from '../../../../common/types';
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
