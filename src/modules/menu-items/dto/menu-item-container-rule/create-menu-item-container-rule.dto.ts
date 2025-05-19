import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

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

    @ApiProperty({ description: 'The amount of the menuItem/Size variation.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    quantity: number;
}