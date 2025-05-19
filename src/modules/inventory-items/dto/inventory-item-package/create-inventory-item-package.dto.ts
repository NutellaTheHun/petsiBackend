import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateInventoryItemPackageDto {
    @ApiProperty({ example: 'Box, Can, Container, Bag', description: 'Name for Inventory-Item-Package entity.' })
    @IsString()
    @IsNotEmpty()
    readonly packageName: string;
}