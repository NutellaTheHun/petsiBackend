import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateInventoryItemPackageDto {
    @ApiProperty({ example: 'Box, Can, Container, Bag', description: 'Name for Inventory-Item-Package entity.' })
    @IsString()
    @IsOptional()
    readonly name?: string;
}