import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateInventoryItemDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsNumber()
    @IsPositive()
    readonly inventoryItemCategoryId: number;

    @IsArray()
    @IsNumber({},{ each: true })
    @IsPositive({ each: true})
    readonly sizeIds: number[] = [];

    @IsNumber()
    @IsPositive()
    readonly vendorId: number;
}

export function CreateDefaultInventoryItemDtoValues(): Partial<CreateInventoryItemDto> {
    return {
        
    };
}