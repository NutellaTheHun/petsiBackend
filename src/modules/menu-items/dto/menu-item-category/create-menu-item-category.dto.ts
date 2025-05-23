import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateMenuItemCategoryDto {
    @ApiProperty({ example: 'Pastry, Pie, Catering, Boxed Pastry', description: 'Name of the Menu-Item-Category.' })
    @IsString()
    @IsNotEmpty()
    readonly categoryName: string;
}