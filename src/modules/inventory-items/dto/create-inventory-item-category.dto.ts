import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateInventoryItemCategoryDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsArray()
    @IsPositive({ each: true})
    @IsNumber({}, { each: true})
    readonly inventoryItemIds: number[] = [];
}

export function CreateDefaultInventoryItemCategoryDtoValues(): Partial<CreateInventoryItemCategoryDto> {
    return {
        inventoryItemIds: []
    };
}