import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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

export class CreateInventoryItemDto {
    @ApiProperty({
        description: 'Name of InventoryItem entity.',
        example: 'Evaporated Milk',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiPropertyOptional({
        description: 'Id of InventoryItemCategory entity.',
        example: 1,
        type: 'number',
        nullable: true,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly categoryId?: EntityId<InventoryItemCategory> | null;

    @ApiPropertyOptional({
        description: 'Id of InventoryItemVendor entity.',
        example: 2,
        type: 'number',
        nullable: true,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly vendorId?: EntityId<InventoryItemVendor> | null;

    @ApiPropertyOptional({
        description:
            'Child dtos are used when creating/updating an entity through a parent (InventoryItem).',
        type: [NestedCreateInventoryItemSizeDto],
        example: [
            {
                createId: 'c1',
                unit: 'lb',
                measureAmount: 2,
                packageId: 3,
                cost: 4.99,
            },
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NestedCreateInventoryItemSizeDto)
    readonly sizes: NestedCreateInventoryItemSizeDto[];
}
