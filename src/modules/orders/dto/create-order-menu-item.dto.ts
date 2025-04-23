import { BaseOrderMenuItemDto } from "./base-order-menu-item.dto";

export class CreateOrderMenuItemDto extends BaseOrderMenuItemDto{
    readonly mode: 'create' = 'create';
}