import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsPositive,
    IsString,
    ValidateNested
} from 'class-validator';
import { EntityId } from '../../../../common/types';
import { InventoryItemCategory } from '../../entities/inventory-item-category.entity';
import { InventoryItemVendor } from '../../entities/inventory-item-vendor.entity';
import { NestedCreateInventoryItemSizeDto } from '../inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../inventory-item-size/nested-update-inventory-item-size.dto';

export class UpdateInventoryItemDto {
    @ApiProperty({
        description: 'Name of InventoryItem entity.',
        example: 'Sliced Almonds',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        description: 'Id of InventoryItemCategory entity.',
        example: 1,
        type: 'number',
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly categoryId: EntityId<InventoryItemCategory> | null;

    @ApiProperty({
        example: 2,
        description: 'Id of InventoryItemVendor entity.',
        type: 'number',
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly vendorId: EntityId<InventoryItemVendor> | null;

    @ApiProperty({
        description: 'TODO',
        type: 'array',
        oneOf: [
            { $ref: getSchemaPath(NestedCreateInventoryItemSizeDto) },
            { $ref: getSchemaPath(NestedUpdateInventoryItemSizeDto) },
        ],
        example: [
            {
                id: 1,
                measureTypeId: 2,
                measureAmount: 3,
                packageId: 4,
                cost: 5.99,
            },
            {
                createId: 'c6',
                inventoryItemId: 7,
                measureTypeId: 8,
                measureAmount: 9,
                packageId: 10,
                cost: 11.99,
            },
        ],
        nullable: true,
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    readonly sizes: (
        | NestedCreateInventoryItemSizeDto
        | NestedUpdateInventoryItemSizeDto
    )[];
}
