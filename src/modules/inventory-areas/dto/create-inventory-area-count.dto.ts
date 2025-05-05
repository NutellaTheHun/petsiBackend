import { IsArray, IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateInventoryAreaCountDto{
    @IsNumber()
    @IsNotEmpty()
    readonly inventoryAreaId: number;
}