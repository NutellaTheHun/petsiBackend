import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { CreateChildInventoryItemSizeDto } from "./create-child-inventory-item-size.dto";

export class CreateInventoryItemDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly inventoryItemCategoryId?: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly vendorId?: number;

    @IsOptional()
    @IsArray()
    readonly itemSizeDtos?: CreateChildInventoryItemSizeDto[];
}
