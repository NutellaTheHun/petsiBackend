import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { MenuItemContainerOptions } from "../../entities/menu-item-container-options.entity";

/**
 * Depreciated, only created as a child through {@link MenuItemContainerOptions}.
 */
export class CreateMenuItemContainerRuleDto {
    @ApiProperty({ description: 'Id of the Menu-Item-Container-Options entity.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    parentContainerOptionsId: number;

    @ApiProperty({ description: 'Id of a Menu-Item entity that is a valid component' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    validMenuItemId: number;

    @ApiProperty({ description: 'Id of a Menu-Item-Size entity that is a valid size to the validMenuItem, and to the container' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    validSizeIds: number[];
}