import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateInventoryItemVendorDto {
    @ApiProperty({ example: 'Cysco, Driscols, Walden Farms', description: 'Name of Inventory-Item-Vendor entity.' })
    @IsString()
    @IsOptional()
    readonly vendorName?: string;
}