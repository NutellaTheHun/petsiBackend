import { IsNotEmpty, IsString } from "class-validator";

export class CreateMenuItemCategoryDto{
    @IsString()
    @IsNotEmpty()
    readonly name: string;
    /*
    @IsArray()
    @IsPositive({ each: true})
    @IsNumber({}, { each: true})
    readonly menuItemIds: number[] = [];*/
}