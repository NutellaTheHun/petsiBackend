import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateChildMenuItemComponentDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating a Menu-Item entity with components.' })
    readonly mode: 'create' = 'create';

    @ApiProperty({ example: 'Breakfast Platter, size: large (Menu-Item-Size, passing containerSizeId): {contained child items}',description: 'Id for Menu-Item-Size entity' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly containerSizeId: number;

    @ApiProperty({ example: 'Box of 6 Scones(parent container): 6 Blueberry Muffin(contained item, passing menuItemId)', description: 'Id for Menu-Item entity. Represents the contained Menu-Item item.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly menuItemId: number;

    @ApiProperty({ example: 'Box of 6 Scones(parent container): 6 Blueberry Muffin(contained item), size: Regular(MenuItemSize)', description: 'Id for Menu-Item-Size. The size of the contained item' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly menuItemSizeId: number;

    @ApiProperty({ description: 'The amount of Menu-Item/Menu-Item-Size combination' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly quantity: number;
}