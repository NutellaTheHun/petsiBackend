import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateChildMenuItemComponentDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating a Menu-Item entity with components.' })
    readonly mode: 'update' = 'update';

    @ApiProperty({ description: 'Id of the Menu-Item-Component to update.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({ example: 'Box of 6 Scones(parent container): 6 Blueberry Muffin(contained item, passing menuItemId)', description: 'Id for Menu-Item entity. Represents the contained Menu-Item item.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly menuItemId?: number;

    @ApiProperty({ example: 'Box of 6 Scones(parent container): 6 Blueberry Muffin(contained item), size: Regular(MenuItemSize)', description: 'Id for Menu-Item-Size. The size of the contained item' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly menuItemSizeId?: number;

    @ApiProperty({ description: 'The amount of Menu-Item/Menu-Item-Size combination' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly quantity?: number;
}