import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateMenuItemComponentDto {
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