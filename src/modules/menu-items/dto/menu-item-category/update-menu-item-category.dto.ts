import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateMenuItemCategoryDto {
    @ApiProperty({ example: 'Pastry, Pie, Catering, Boxed Pastry', description: 'Name of the Menu-Item-Category.' })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    readonly categoryName?: string;
}