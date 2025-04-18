import { BaseInventoryAreaItemDto } from "./base-inventory-area-item.dto";

export class CreateInventoryAreaItemDto extends BaseInventoryAreaItemDto {
    readonly mode: 'create' = 'create';
}