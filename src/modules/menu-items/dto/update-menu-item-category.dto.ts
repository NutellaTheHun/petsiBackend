import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateMenuItemCategoryDto {
    @ApiProperty({ example: 'Pastry, Pie, Catering, Boxed Pastry', description: 'Name of the Menu-Item-Category.' })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    readonly name?: string;

    @ApiProperty({ description: 'List of Menu-Item ids that fall under the referencing category.' })
    @IsArray()
    @IsPositive({ each: true})
    @IsNumber({}, { each: true})
    @IsOptional()
    readonly menuItemIds?: number[];
}