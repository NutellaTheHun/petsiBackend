import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class UpdateInventoryAreaDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;
    
    @IsArray()
    @IsNumber({}, { each: true})
    @IsPositive()
    readonly inventoryCountIds: number[] = [];
}