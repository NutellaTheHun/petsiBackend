import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { plainToInstance, Transform, TransformFnParams } from 'class-transformer';
import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    ValidateNested
} from 'class-validator';
import { EntityId } from '../../../../common/types';
import { InventoryItemCategory } from '../../entities/inventory-item-category.entity';
import { InventoryItemVendor } from '../../entities/inventory-item-vendor.entity';
import { NestedCreateInventoryItemSizeDto } from '../inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../inventory-item-size/nested-update-inventory-item-size.dto';

@ApiExtraModels(NestedCreateInventoryItemSizeDto, NestedUpdateInventoryItemSizeDto)
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
        nullable: true,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly categoryId?: EntityId<InventoryItemCategory> | null;

    @ApiProperty({
        example: 2,
        description: 'Id of InventoryItemVendor entity.',
        type: 'number',
        nullable: true,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly vendorId?: EntityId<InventoryItemVendor> | null;

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
                unit: 'lb',
                measureAmount: 3,
                packageId: 4,
                cost: 5.99,
            },
            {
                createId: 'c6',
                inventoryItemId: 7,
                unit: 'oz',
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
    @Transform(({ value }: TransformFnParams) => {
        if (!Array.isArray(value)) return value;
        return value.map((item: any) =>
            'createId' in item && item.createId !== undefined
                ? plainToInstance(NestedCreateInventoryItemSizeDto, item)
                : plainToInstance(NestedUpdateInventoryItemSizeDto, item)
        );
    })
    readonly sizes: (
        | NestedCreateInventoryItemSizeDto
        | NestedUpdateInventoryItemSizeDto
    )[];
}
