import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateInventoryAreaDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsArray()
    @IsNumber({}, { each: true})
    @IsPositive()
    readonly inventoryCountIds: number[] = [];
}

export function CreateDefaultInventoryAreaDtoValues(){
    return [

    ];
}