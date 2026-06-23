import { MenuItem } from '../../entities/menu-item.entity';

export const MENU_ITEM_SNAPSHOT_PAYLOAD_VERSION = 1 as const;

export interface MenuItemContainerLineSnapshotV1 {
    containedMenuItemId: number;
    containedItemSizeId: number;
    parentItemSizeId: number;
    quantity: number;
}

export interface MenuItemSnapshotV1 {
    payloadVersion: typeof MENU_ITEM_SNAPSHOT_PAYLOAD_VERSION;
    name: string;
    type: string;
    categoryId: number | null;
    sizeIds: number[];
    variableMaxAmount: number | null;
    containerItems: MenuItemContainerLineSnapshotV1[];
}

export function isMenuItemSnapshotV1(v: unknown): v is MenuItemSnapshotV1 {
    return (
        typeof v === 'object' &&
        v !== null &&
        (v as MenuItemSnapshotV1).payloadVersion ===
            MENU_ITEM_SNAPSHOT_PAYLOAD_VERSION
    );
}

export function menuItemToSnapshotV1(entity: MenuItem): MenuItemSnapshotV1 {
    return {
        payloadVersion: MENU_ITEM_SNAPSHOT_PAYLOAD_VERSION,
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
    };
}
