import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateInventoryAreaCountDto{
    @IsNumber()
    @IsNotEmpty()
    readonly inventoryAreaId: number;
}