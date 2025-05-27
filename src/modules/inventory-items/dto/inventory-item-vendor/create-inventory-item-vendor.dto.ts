import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateInventoryItemVendorDto {
    @ApiProperty({ example: 'Cysco, Driscols, Walden Farms', description: 'Name of InventoryItemVendor entity.' })
    @IsString()
    @IsNotEmpty()
    readonly vendorName: string;
}