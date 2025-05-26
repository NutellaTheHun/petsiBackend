import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateInventoryItemPackageDto {
    @ApiProperty({ example: 'Box, Can, Container, Bag', description: 'Name for InventoryItemPackage entity.' })
    @IsString()
    @IsOptional()
    readonly packageName?: string;
}