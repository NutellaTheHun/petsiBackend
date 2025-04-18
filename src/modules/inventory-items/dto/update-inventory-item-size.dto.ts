import { IsNumber, IsPositive } from "class-validator";
import { BaseInventoryItemSizeDto } from "./base-inventory-item-size.dto";

export class UpdateInventoryItemSizeDto extends BaseInventoryItemSizeDto{
    readonly mode: 'update' = 'update';

    @IsNumber()
    @IsPositive()
    readonly id: number;
}