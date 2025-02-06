import { IsNotEmpty, IsString } from "class-validator";

export class CreateMenuCategoryDto{
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}