import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { MenuItem } from "../../entities/menu-item.entity";

/**
 * Depreciated, only created as a child through {@link MenuItem}.
 */
export class CreateMenuItemContainerItemDto {
    @ApiProperty({
        example: 'Box of 6 Scones(parent container, passing containerId): 6 Blueberry Muffin(contained item)',
        description: 'Id of a Menu-Item entity, the parent container to the child Menu-Item component.'
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly parentContainerId: number;

    @ApiProperty({
        example: 'Breakfast Platter, size: large (Menu-Item-Size, passing containerSizeId): {contained child items}',
        description: 'Id of a Menu-Item-Size entity of the parent container'
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly parentContainerSizeId: number;

    @ApiProperty({
        example: 'Box of 6 Scones(parent container): 6 Blueberry Muffin(contained item, passing menuItemId)',
        description: 'Id of a Menu-Item entity. Represents the contained Menu-Item item.'
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly containedMenuItemId: number;

    @ApiProperty({
        example: 'Box of 6 Scones(parent container): 6 Blueberry Muffin(contained item), size: Regular(MenuItemSize)',
        description: 'Id of a Menu-Item-Size entity. The size of the contained item'
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly containedMenuItemSizeId: number;

    @ApiProperty({ description: 'The amount of Menu-Item/Menu-Item-Size combination' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly quantity: number;
}