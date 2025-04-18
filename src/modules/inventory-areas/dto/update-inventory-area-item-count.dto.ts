import { IsNumber, IsPositive } from "class-validator";
import { BaseInventoryAreaItemDto } from "./base-inventory-area-item.dto";

export class UpdateInventoryAreaItemDto extends BaseInventoryAreaItemDto{
    readonly mode: 'update' = 'update';

    @IsNumber()
    @IsPositive()
    readonly id: number;
}