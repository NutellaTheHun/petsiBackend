import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateMenuItemContainerItemDto {
    @ApiProperty({
        example: 'Box of 6 Scones(parent container): 6 Blueberry Muffin(contained item, passing menuItemId)',
        description: 'Id of a MenuItem entity. Represents the contained item.',
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly containedMenuItemId?: number;

    @ApiProperty({
        example: 'Box of 6 Scones(parent container): 6 Blueberry Muffin(contained item), size: Regular(MenuItemSize)',
        description: 'Id of a MenuItemSize entity. The size of the contained item',
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly containedMenuItemSizeId?: number;

    @ApiProperty({ description: 'The amount of MenuItem/MenuItemSize combination' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly quantity?: number;
}