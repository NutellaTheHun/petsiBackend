import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { CreateInventoryItemSizeDto } from "./create-inventory-item-size.dto";
import { Unique } from "typeorm";

export class CreateInventoryItemDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly inventoryItemCategoryId: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly vendorId: number;

    @IsOptional()
    @IsArray()
    readonly itemSizeDtos?: CreateInventoryItemSizeDto[];
}
