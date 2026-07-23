import { FieldRegistry } from './field-registry.types';
import { orderMenuItemsRegistry } from './order-menu-items.registry';
import { ordersRegistry } from './orders.registry';

export const FIELD_REGISTRY: FieldRegistry = {
    orders: ordersRegistry,
    orderMenuItems: orderMenuItemsRegistry,
};

export { ordersRegistry, orderMenuItemsRegistry };
export * from './field-registry.types';
