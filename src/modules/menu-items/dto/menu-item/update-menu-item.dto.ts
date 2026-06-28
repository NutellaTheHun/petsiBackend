import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    ValidateNested
} from 'class-validator';

import { plainToInstance, Transform, TransformFnParams, Type } from 'class-transformer';
import { EntityId } from '../../../../common/types';
import { MenuItemCategory } from '../../entities/menu-item-category.entity';
import { MenuItemSize } from '../../entities/menu-item-size.entity';
import { NestedCreateMenuItemContainerItemDto } from '../menu-item-container-item/nested-create-menu-item-container-item.dto';
import { NestedUpdateMenuItemContainerItemDto } from '../menu-item-container-item/nested-update-menu-item-container-item.dto';
import { DynamicPropertyValueDto } from './dynamic-property-value.dto';

@ApiExtraModels(NestedCreateMenuItemContainerItemDto, NestedUpdateMenuItemContainerItemDto)
export class UpdateMenuItemDto {
    @ApiProperty({
        description: 'Name of MenuItem entity.',
        example: 'box of 6 muffins',
        type: 'string',
    })
    @IsString()
    @IsNotEmpty()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        description: 'Can be single, fixed_container, or variable_container',
        example: 'fixed_container',
        type: 'string',
    })
    @IsNotEmpty()
    @IsString()
    readonly type: string;

    @ApiProperty({
        description:
            'Id of MenuItemCategory entity. Pass a null value to remove category',
        example: 1,
        type: 'number',
        nullable: true,
    })
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    readonly categoryId: EntityId<MenuItemCategory> | null;

    @ApiProperty({
        description:
            'When present, replaces all sizes for this menu item. Omit to leave sizes unchanged.',
        example: [5, 6],
        type: () => [Number],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true })
    readonly sizeIds?: EntityId<MenuItemSize>[];

    @ApiProperty({
        description: 'TODO',
        type: 'array',
        oneOf: [
            { $ref: getSchemaPath(NestedCreateMenuItemContainerItemDto) },
            { $ref: getSchemaPath(NestedUpdateMenuItemContainerItemDto) },
        ],
        example: [
            {
                id: 1,
                containedMenuItemId: 2,
                containedMenuItemSizeId: 3,
                quantity: 4,
            },
            {
                createId: 'c5',
                containedMenuItemId: 6,
                containedMenuItemSizeId: 7,
                quantity: 8,
                parentMenuItemId: 9,
                parentItemSizeId: 10,
            },
        ],
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Transform(({ value }: TransformFnParams) => {
        if (!Array.isArray(value)) return value;
        return value.map((item: any) =>
            'createId' in item && item.createId !== undefined
                ? plainToInstance(NestedCreateMenuItemContainerItemDto, item)
                : plainToInstance(NestedUpdateMenuItemContainerItemDto, item)
        );
    })
    readonly containerMenuItems?: (
        | NestedCreateMenuItemContainerItemDto
        | NestedUpdateMenuItemContainerItemDto
    )[] | null;

    @ApiProperty({
        description:
            'Total size limit of item, when item is of type fixed_container or variable_container',
        type: 'number',
        example: 6,
        nullable: true,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly variableMaxAmount?: number | null;

    @ApiProperty({
        description: 'Dynamic property values to upsert or clear. Omit a configId to leave that value unchanged.',
        type: () => [DynamicPropertyValueDto],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DynamicPropertyValueDto)
    readonly dynamicProperties?: DynamicPropertyValueDto[];
}
