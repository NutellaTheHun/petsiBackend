import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateInventoryItemVendorDto{
    @ApiProperty({ example: 'Cysco, Driscols, Walden Farms', description: 'Name of Inventory-Item-Vendor entity.' })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    readonly name?: string;

    @ApiProperty({ description: 'Array of Inventory-Item ids that are from the vendor.' })
    @IsArray()
    @IsPositive({ each: true})
    @IsNumber({}, { each: true})
    @IsOptional()
    readonly inventoryItemIds?: number[];
}