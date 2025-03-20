import { IsArray, IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { CreateInventoryAreaItemCountDto } from "./create-inventory-area-item-count.dto";

export class CreateInventoryAreaCountDto{
    @IsNumber()
    @IsNotEmpty()
    readonly inventoryAreaId: number;

    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true})
    readonly itemCountCreateDto: CreateInventoryAreaItemCountDto[] = [];
}

export function CreateDefaultInventoryAreaCountDtoValues(){
    return [

    ];
}