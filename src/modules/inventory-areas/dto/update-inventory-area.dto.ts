import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateInventoryAreaDto {
    @IsString()
    @IsOptional()
    readonly name?: string;
    
    @IsArray()
    @IsNumber({}, { each: true})
    @IsPositive()
    @IsOptional()
    readonly inventoryCountIds?: number[];
}