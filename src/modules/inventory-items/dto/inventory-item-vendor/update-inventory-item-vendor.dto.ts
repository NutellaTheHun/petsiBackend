import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateInventoryItemVendorDto{
    @ApiProperty({ example: 'Cysco, Driscols, Walden Farms', description: 'Name of Inventory-Item-Vendor entity.' })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    readonly vendorName?: string;
}