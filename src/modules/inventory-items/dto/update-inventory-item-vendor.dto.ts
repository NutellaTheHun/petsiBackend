import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";


export class UpdateInventoryItemVendorDto{
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    readonly name: string;

    @IsArray()
    @IsPositive({ each: true})
    @IsNumber({}, { each: true})
    @IsOptional()
    readonly inventoryItemIds: number[];
}