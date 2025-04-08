import { IsArray, IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateInventoryAreaCountDto {
    @IsNumber()
    @IsOptional()
    readonly inventoryAreaId: number;
    
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true})
    @IsOptional()
    readonly inventoryItemCountIds: number[] = [];
}