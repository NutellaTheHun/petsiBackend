import { IsNotEmpty, IsString } from "class-validator";

export class CreateInventoryItemCategoryDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}