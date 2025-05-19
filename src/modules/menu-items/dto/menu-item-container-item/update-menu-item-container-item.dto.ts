import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateMenuItemContainerItemDto {
    @ApiProperty({ 
        example: 'Box of 6 Scones(parent container): 6 Blueberry Muffin(contained item, passing menuItemId)', 
        description: 'Id of a Menu-Item entity. Represents the contained item.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly containedMenuItemId?: number;

    @ApiProperty({ 
        example: 'Box of 6 Scones(parent container): 6 Blueberry Muffin(contained item), size: Regular(MenuItemSize)', 
        description: 'Id of a Menu-Item-Size entity. The size of the contained item' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly containedMenuItemSizeId?: number;

    @ApiProperty({ description: 'The amount of Menu-Item/Menu-Item-Size combination' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly quantity?: number;
}