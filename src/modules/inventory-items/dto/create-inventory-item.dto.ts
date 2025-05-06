import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { CreateInventoryItemSizeDto } from "./create-inventory-item-size.dto";

export class CreateInventoryItemDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsNumber()
    @IsPositive()
    readonly inventoryItemCategoryId: number;

    @IsNumber()
    @IsPositive()
    readonly vendorId: number;

    @IsOptional()
    @IsArray()
    readonly itemSizeDtos?: CreateInventoryItemSizeDto[];
}
