import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateMenuCategoryDto{
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsArray()
    @IsPositive({ each: true})
    @IsNumber({}, { each: true})
    readonly menuItemIds: number[] = [];
}