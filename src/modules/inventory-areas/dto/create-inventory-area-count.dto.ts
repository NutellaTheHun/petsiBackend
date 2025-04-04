import { IsArray, IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateInventoryAreaCountDto{
    @IsNumber()
    @IsNotEmpty()
    readonly inventoryAreaId: number;
    /*
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true})
    readonly inventoryItemCountIds: number[] = [];*/
}

export function CreateDefaultInventoryAreaCountDtoValues(){
    return [

    ];
}