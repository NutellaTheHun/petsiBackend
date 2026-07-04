---
module: src/modules/menu-items
last_reviewed: 2026-07-04
---

## Overview

This module owns the sellable-product catalog: `MenuItem`, `MenuItemSize`, `MenuItemCategory`, `MenuItemContainerItem`, and `MenuItemDynamicPropertyValue` (backed by `src/modules/dynamic-properties`).

A `MenuItem.type` is either `MENU_ITEM_TYPES.SINGLE` or `MENU_ITEM_TYPES.CONTAINER` (`utils/menu-item-type.ts`). A container's makeup is expressed as a flat list of `MenuItemContainerItem` rows (`containerMenuItems` on `MenuItem`, cascade), each row pointing at a `parentMenuItem`+`parentItemSize` and a `containedMenuItem`+`containedItemSize`+`quantity`. Two flavors exist, distinguished by `MenuItem.variableMaxAmount` (nullable):
- **Fixed container** (`variableMaxAmount: null`) — e.g. "Pastry Platter": each size (small/medium/large) has its own fixed set of container lines with fixed quantities.
- **Variable-max container** (`variableMaxAmount: 6` for "Box of 6 Scones") — any combination of contained items is allowed as long as each line's `quantity` equals `variableMaxAmount` (see Enforced Patterns).

Nesting is exactly one level deep — a container's `containedMenuItem` must itself be `type: SINGLE`; there is no recursive "container of containers" concept anywhere in the entity, validator, or composer code.

`MenuItem` participates in `revision-history` (`REVISION_ENTITY_TYPES.MENU_ITEM`): `MenuItemService.afterCreateInTransaction`/`afterUpdateInTransaction` append a versioned snapshot via `RevisionHistoryService.appendRevision`, and `MenuItemService.revertToRevision` restores a prior snapshot wholesale. `MenuItemController` exposes this at `GET /menu-items/:id/revisions`, `GET /menu-items/:id/revisions/:revisionNumber`, and `PUT /menu-items/:id/revisions/:revisionNumber/revert`.

`src/modules/orders` consumes this module directly: `OrderMenuItem` references `MenuItem`+`MenuItemSize` as a line item on an order, and when that ordered `MenuItem` is a container, `OrderContainerItem` rows mirror the same "contained item + size + quantity" shape as `MenuItemContainerItem` (see `src/modules/orders/CLAUDE.md`). `src/modules/labels` also depends on this module: `Label.menuItem` is a `ManyToOne(() => MenuItem, { onDelete: 'CASCADE' })`, so deleting a `MenuItem` cascades to delete its labels.

Key relationships:
- `MenuItem 1—* MenuItemContainerItem` via both `parentMenuItem` (cascade, `orphanedRowAction: 'delete'`) and `containedMenuItem` (`onDelete: 'CASCADE'`) — a single `MenuItem` can appear as either side of a container line, but a row referencing it as `containedMenuItem` requires that item's `type` be `SINGLE`.
- `MenuItem *—* MenuItemSize` via a join table, plus `MenuItemContainerItem.parentItemSize`/`containedItemSize` (both `onDelete: 'CASCADE'`) which must each be a member of the referencing `MenuItem`'s own `sizes` (enforced by `enforceValidSize`).
- `MenuItem *—1 MenuItemCategory` (nullable, `SET NULL` on delete, `eager: true`).
- `MenuItem 1—* MenuItemDynamicPropertyValue` (eager, `unique(['menuItem','config'])`), which drives the computed, non-persisted `dynamicProperties` array via `@AfterLoad() computeDynamicProperties()`.
- `src/modules/orders`'s `OrderMenuItem`/`OrderContainerItem` reference `MenuItem`/`MenuItemSize`; `src/modules/labels`'s `Label` references `MenuItem` the same way.

## Enforced Patterns

- **Containers cannot contain containers.** `MenuItemContainerItemValidator.validateIdentity` requires the contained item's `type` be `SINGLE` (`enforcePropertyState`) and, symmetrically, the parent must be `CONTAINER`. `MenuItemValidator` additionally rejects a `MenuItem` update/create that supplies `containerMenuItems` while `type !== CONTAINER`, and rejects a container line whose `containedMenuItemId === identity.id` (self-containment).
- **Variable-max containers require every line's quantity to equal `variableMaxAmount` exactly**, not merely sum to it — despite doc-comment phrasing about "totaling to 6," the actual check in `MenuItemValidator.validateIdentity` is per-line: each container line's `quantity` field itself must equal `variableMaxAmount`. Following the doc comment literally (e.g. quantities of 2/2/2 summing to 6) produces validation errors.
- **A `MenuItemSize` used on a container line must belong to the referencing item's own `sizes` array** — `enforceValidSize` is called for both `containedItemSizeId` (must be in `containedMenuItem.sizes`) and `parentItemSizeId` (must be in `parentMenuItem.sizes`). Passing e.g. a pie size onto a pastry container line fails validation even though the size id itself exists in the DB.
- **`MenuItemContainerItem` uniqueness is `(parentMenuItem, parentItemSize, containedMenuItem, containedItemSize)`** (DB `@Unique`) plus an application-level duplicate check via `enforceNoDuplicateElements` keyed on `containedMenuItemId:containedItemSizeId:parentItemSizeId` — two container lines with the same contained-item/size combo (even with different quantities) are rejected with `DUPLICATE_ITEMS`, not silently merged/summed.
- **`MenuItemContainerItemController`'s `create`/`update` endpoints are dead** — they unconditionally `throw new Error('Endpoint not available')`. Container lines can only be created/updated by nesting them inside a `MenuItem` create/update payload's `containerMenuItems` field.
- **Setting `MenuItem.type` to `SINGLE` on an existing container wipes its container lines and its `variableMaxAmount`, and desynchronizes active orders.** `MenuItemService.updateEntity` clears `containerMenuItems`/`variableMaxAmount` and calls `syncOrderMenuItems`, which finds all `OrderMenuItem` rows referencing this menu item on non-frozen orders with a future `fulfillmentDate` and deletes their `OrderContainerItem` children outright (not repopulated) — any pending order for that item silently loses its container breakdown.
- **`MenuItemService.updateEntity`'s container-line reconciliation is diff-then-remove, not replace-all.** It composes the new set, then explicitly removes any previously-existing line whose id isn't in the new result set. Omitting `containerMenuItems` from an update DTO leaves existing lines untouched; passing an empty array clears them all.
- **`MenuItem.name` and `MenuItemSize.name`/`MenuItemCategory.name` are globally unique** (DB `@Column({ unique: true })` plus `enforceUnique` in each validator) — a hard DB constraint as well as an app-level `ALREADY_EXISTS` check, so seeding/test helpers must prefix names per test run to avoid collisions across parallel test runs.
- **Menu item snapshots are versioned (`MenuItemSnapshotV1`/`V2`) and validated at read time before revert.** `MenuItemService.revertToRevision` throws `BadRequestException` if the stored payload matches neither snapshot shape rather than trusting old/foreign JSONB. V2 adds `dynamicProperties` on top of V1's `containerItems`; `applyMenuItemSnapshotV2` calls `applyMenuItemSnapshotV1` first, then separately wipes and rebuilds dynamic property value rows. A new persisted field on `MenuItem` that should survive revert requires updating the snapshot interface, the to-snapshot function, and the apply function together — the entity alone isn't enough.
- **A `dynamicProperties` entry's `configId` must belong to a config scoped to `HolderEntityType.MenuItem`**, and if that config has a non-null `holderCategory`, the menu item's effective category must match it exactly, or `INVALID_PROPERTY_VALUE` on `configId` is raised. Separately, changing `categoryId` on an existing item is rejected if doing so would leave stale dynamic property value rows behind — category reassignment is blocked until those values are cleared first.
- **Deleting a `MenuItem` cascades hard through the graph**: `containerMenuItems` (`orphanedRowAction: 'delete'` + `cascade: true`) and any `Label` row referencing it (`onDelete: 'CASCADE'`) are deleted; only `category` (`SET NULL`) survives.

## Gotchas
