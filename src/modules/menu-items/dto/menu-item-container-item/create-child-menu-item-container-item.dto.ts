import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateChildMenuItemContainerItemDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating a MenuItem entity with components.' })
    @IsNotEmpty()
    readonly mode: 'create' = 'create';

    @ApiProperty({
        example: 'Breakfast Platter, size: large (MenuItemSize, passing containerSizeId): {contained child items}',
        description: 'Id of a MenuItemSize entity of the parent container',
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly parentContainerSizeId: number;

    @ApiProperty({
        example: 'Box of 6 Scones(parent container): 6 Blueberry Muffin(contained item, passing menuItemId)',
        description: 'Id of a MenuItem entity. Represents the contained MenuItem item.',
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly containedMenuItemId: number;

    @ApiProperty({
        example: 'Box of 6 Scones(parent container): 6 Blueberry Muffin(contained item), size: Regular(MenuItemSize)',
        description: 'Id of a MenuItemSize. The size of the contained item',
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly containedMenuItemSizeId: number;

    @ApiProperty({ description: 'The amount of MenuItem/MenuItemSize combination' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly quantity: number;
}