import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateInventoryAreaDto {
    @ApiProperty({ example: 'Dry Storage, Walkin, Freezer', description: 'Name of the Inventory-Area.' })
    @IsString()
    @IsOptional()
    readonly areaName?: string;
}