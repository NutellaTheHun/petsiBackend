import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    ValidateNested,
} from 'class-validator';
import { EntityId } from '../../../../common/types';
import { MenuItemCategory } from '../../entities/menu-item-category.entity';
import { MenuItemSize } from '../../entities/menu-item-size.entity';
import { NestedCreateMenuItemContainerItemDto } from '../menu-item-container-item/nested-create-menu-item-container-item.dto';

export class CreateMenuItemDto {
    @ApiProperty({
        description: 'Name of MenuItem entity.',
        example: 'classic apple',
        type: 'string',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        description: 'Can be single, fixed_container, or variable_container',
        example: 'fixed_container',
        nullable: true,
        type: 'string',
    })
    @IsNotEmpty()
    @IsString()
    readonly type: string;

    @ApiPropertyOptional({
        description: 'Id of MenuItemCategory entity.',
        example: 1,
        type: 'number',
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly categoryId?: EntityId<MenuItemCategory>;

    @ApiProperty({
        description:
            'Ids of MenuItemSize entities. Represents the sizes available for the referencing MenuItem.',
        example: [5, 6],
        type: () => Number,
        isArray: true,
    })
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true })
    @IsNotEmpty()
    readonly sizeIds: EntityId<MenuItemSize>[];

    @ApiPropertyOptional({
        description: 'Array of CreateMenutItemContainerItemDtos',
        type: () => [NestedCreateMenuItemContainerItemDto],
        example: [
            {
                createId: 'c1',
                containedMenuItemId: 2,
                containedMenuItemSizeId: 3,
                quantity: 4,
                parentMenuItemId: 5,
                parentItemSizeId: 6,
            },
        ],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    readonly containerMenuItems?: NestedCreateMenuItemContainerItemDto[];

    @ApiPropertyOptional({
        description:
            'Total size limit of item, when item is of type fixed_container or variable_container',
        type: 'number',
        example: 7,
        nullable: true,
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly variableMaxAmount?: number | null;
}
