import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { BaseInventoryItemSizeDto } from "./base-item-size.dto";

export class CreateInventoryItemSizeDto extends BaseInventoryItemSizeDto {
    readonly mode: 'create' = 'create';
}