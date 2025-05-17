import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateComponentOptionDto {
    @ApiProperty({ description: 'Id of a Menu-Item entity that is a valid component' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    validMenuItemId?: number;

    @ApiProperty({ description: 'Id of a Menu-Item-Size entity that is a valid size to the validMenuItem, and to the container' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    validSizeIds?: number[];

    @ApiProperty({ description: 'The amount of the menuItem/Size variation.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    quantity?: number;
}