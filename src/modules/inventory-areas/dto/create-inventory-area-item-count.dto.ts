import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateInventoryItemSizeDto } from "../../inventory-items/dto/create-inventory-item-size.dto";

export class CreateInventoryAreaItemCountDto {

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryAreaId: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly areaCountId: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryItemId: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly unitAmount: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly measureAmount: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly itemSizeId: number;

    @IsOptional()
    readonly itemSizeCreateDto: CreateInventoryItemSizeDto;
}

export function CreateDefaultInventoryAreaItemCountDtoValues(){
    return [

    ];
}