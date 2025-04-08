import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateInventoryItemVendorDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    /*@IsArray()
    @IsPositive({ each: true})
    @IsNumber({}, { each: true})
    readonly inventoryItemIds: number[] = [];*/
}

export function CreateDefaultInventoryItemVendorDtoValues(): Partial<CreateInventoryItemVendorDto> {
    return {
        //inventoryItemIds: []
    };
}