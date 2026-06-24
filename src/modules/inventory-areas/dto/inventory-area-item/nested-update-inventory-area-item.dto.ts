import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, ValidateNested } from 'class-validator';
import { NestedUpdateDto } from '../../../../common/base/nested-update-dto.base';
import { EntityId } from '../../../../common/types';
import { NestedCreateInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { InventoryItemSize } from '../../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';

export class NestedUpdateInventoryAreaItemDto extends NestedUpdateDto {
    @ApiProperty({
        description: 'Id for InventoryItem entity.',
        example: 1,
        type: Number,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly countedInventoryItemId: EntityId<InventoryItem>;

    @ApiProperty({
        description: 'The amount of InventoryItem per unit.',
        example: 6,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly amount: number;

    @ApiProperty({
        description:
            'Id for InventoryItemSize entity. If countedItemSizeId is populated, countedItemSizeDto must be null/undefined.',
        example: 2,
        type: Number,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly countedItemSizeId?: EntityId<InventoryItemSize>;

    @ApiProperty({
        description:
            'If countedItemSizeDto is populated, countedItemSizeId must be null/undefined.',
        type: NestedCreateInventoryItemSizeDto,
        required: false,
        example: {
            createId: 'c1234',
            unit: 'lb',
            measureAmount: 2,
            packageId: 3,
            cost: 4,
        },
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => NestedCreateInventoryItemSizeDto)
    readonly countedItemSize?: NestedCreateInventoryItemSizeDto
}
