import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateChildMenuItemContainerItemDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating a Menu-Item entity with components.' })
    @IsNotEmpty()
    readonly mode: 'update' = 'update';

    @ApiProperty({ description: 'Id of a Menu-Item-Container-Item to update.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({ 
        example: 'Box of 6 Scones(parent container): 6 Blueberry Muffin(contained item, passing containedMenuItemId)', 
        description: 'Id of a Menu-Item entity. Represents the contained Menu-Item item.' })
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