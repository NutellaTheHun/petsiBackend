import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateInventoryAreaCountDto{
    @ApiProperty({ description: 'Id for Inventory-Area entity.' })
    @IsNumber()
    @IsNotEmpty()
    readonly inventoryAreaId: number;
}