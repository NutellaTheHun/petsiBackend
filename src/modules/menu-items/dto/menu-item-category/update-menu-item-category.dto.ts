import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateMenuItemCategoryDto {
    @ApiProperty({ example: 'Pastry, Pie, Catering, Boxed Pastry', description: 'Name of the MenuItemCategory.' })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    readonly categoryName?: string;
}