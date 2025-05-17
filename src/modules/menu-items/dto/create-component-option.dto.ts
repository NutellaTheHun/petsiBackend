import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateComponentOptionDto {
    @ApiProperty({ description: 'Id of the Menu-Item-Component-Options entity.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    parentOptionsId: number;

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