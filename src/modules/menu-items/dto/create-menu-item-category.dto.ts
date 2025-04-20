import { IsNotEmpty, IsString } from "class-validator";

export class CreateMenuItemCategoryDto{
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}