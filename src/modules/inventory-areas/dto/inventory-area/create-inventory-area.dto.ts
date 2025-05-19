import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateInventoryAreaDto {
    @ApiProperty({ example: 'Dry Storage, Walkin, Freezer', description: 'Name of the Inventory-Area.' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}