import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, ValidateNested } from 'class-validator';
import { NestedCreateDto } from '../../../../common/base/nested-create-dto.base';
import { EntityId } from '../../../../common/types';
import { NestedCreateInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { InventoryItemSize } from '../../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';

export class NestedCreateInventoryAreaItemDto extends NestedCreateDto {
    @ApiProperty({
        description: 'Id for InventoryItem entity.',
        example: 2,
        type: Number,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly countedInventoryItemId: EntityId<InventoryItem>;

    @ApiProperty({
        description: 'The amount of InventoryItem per unit.',
        example: 6,
        type: Number,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly amount: number;

    @ApiProperty({
        description:
            'Id for InventoryItemSize entity. If countedItemSizeId is null, countedItemSize must be populated.',
        example: 3,
        type: Number,
        required: false,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly countedItemSizeId?: EntityId<InventoryItemSize>;

    @ApiProperty({
        description:
            'Is optional, if countedItemSize is null, countedItemSizeId must be populated.',
        type: NestedCreateInventoryItemSizeDto,
        required: false,
        example: {
            createId: 'c1356',
            unit: 'lb',
            measureAmount: 3,
            packageId: 4,
            cost: 5.99,
        },
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => NestedCreateInventoryItemSizeDto)
    readonly countedItemSize?: NestedCreateInventoryItemSizeDto;
}
