import { IsArray, IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class UpdateInventoryAreaCountDto {
    @IsNumber()
    @IsNotEmpty()
    readonly inventoryAreaId: number;
    
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true})
    readonly inventoryItemCountIds: number[] = [];
}