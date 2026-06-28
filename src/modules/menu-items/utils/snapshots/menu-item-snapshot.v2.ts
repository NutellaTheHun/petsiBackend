import { MenuItem } from '../../entities/menu-item.entity';
import { MenuItemContainerLineSnapshotV1 } from './menu-item-snapshot.v1';

export const MENU_ITEM_SNAPSHOT_V2_PAYLOAD_VERSION = 2 as const;

export interface MenuItemDynamicPropertySnapshotEntry {
    configId: number;
    valueText: string | null;
    valueEntityId: number | null;
}

export interface MenuItemSnapshotV2 {
    payloadVersion: typeof MENU_ITEM_SNAPSHOT_V2_PAYLOAD_VERSION;
    name: string;
    type: string;
    categoryId: number | null;
    sizeIds: number[];
    variableMaxAmount: number | null;
    containerItems: MenuItemContainerLineSnapshotV1[];
    dynamicProperties: MenuItemDynamicPropertySnapshotEntry[];
}

export function isMenuItemSnapshotV2(v: unknown): v is MenuItemSnapshotV2 {
    return (
        typeof v === 'object' &&
        v !== null &&
        (v as MenuItemSnapshotV2).payloadVersion ===
            MENU_ITEM_SNAPSHOT_V2_PAYLOAD_VERSION
    );
}

export function menuItemToSnapshotV2(entity: MenuItem): MenuItemSnapshotV2 {
    return {
        payloadVersion: MENU_ITEM_SNAPSHOT_V2_PAYLOAD_VERSION,
        name: entity.name,
        type: entity.type,
        categoryId: entity.category?.id ?? null,
        sizeIds: (entity.sizes ?? []).map((s) => s.id).sort((a, b) => a - b),
        variableMaxAmount: entity.variableMaxAmount ?? null,
        containerItems: (entity.containerMenuItems ?? []).map((c) => ({
            containedMenuItemId: c.containedMenuItem.id,
            containedItemSizeId: c.containedItemSize.id,
            parentItemSizeId: c.parentItemSize.id,
            quantity: Number(c.quantity),
        })),
        dynamicProperties: (entity.dynamicPropertyValues ?? []).map((dpv) => ({
            configId: dpv.config.id,
            valueText: dpv.valueText,
            valueEntityId: dpv.valueEntityId ?? null,
        })),
    };
}
