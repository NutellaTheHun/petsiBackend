import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateInventoryAreaDto {
    @ApiProperty({ example: 'Dry Storage, Walkin, Freezer', description: 'Name of the Inventory-Area.' })
    @IsString()
    @IsOptional()
    readonly name?: string;
    
    @ApiProperty({ description: 'Array of Ids of Inventory-Area-Count entities.' })
    @IsArray()
    @IsNumber({}, { each: true})
    @IsPositive()
    @IsOptional()
    readonly inventoryCountIds?: number[];
}