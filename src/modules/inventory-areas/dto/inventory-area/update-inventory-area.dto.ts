import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateInventoryAreaDto {
    @ApiProperty({ example: 'Dry Storage, Walkin, Freezer', description: 'Name of the InventoryArea.' })
    @IsString()
    @IsOptional()
    readonly areaName?: string;
}