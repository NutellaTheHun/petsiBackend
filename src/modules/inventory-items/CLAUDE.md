---
module: src/modules/inventory-items
last_reviewed: 2026-07-04
---

## Overview

This module owns the inventory catalog: `InventoryItem` is the root entity, with four supporting lookup/child entities: `InventoryItemCategory`, `InventoryItemVendor`, `InventoryItemPackage`, and `InventoryItemSize`. Each gets its own controller/service/validator/builder/change-detector, wired together in `inventory-items.module.ts`.

An `InventoryItem` has a unique `name`, an optional `category` (`ManyToOne`, `onDelete: 'SET NULL'`), an optional `vendor` (same), and a `OneToMany` collection of `InventoryItemSize` (`cascade: true`). An `InventoryItemSize` is the join of an item to a physical form: it pairs an `InventoryItemPackage` ("box", "bag", "can"), a unit symbol (`AppUnit`, validated against `UNITS` from `src/common/units`), a `measureAmount`, and an optional `cost` (decimal string, `@Check("cost" >= 0)`). `InventoryItemCategory`, `InventoryItemVendor`, and `InventoryItemPackage` are otherwise plain unique-named lookup tables with no other fields.

This module is consumed by two other modules directly:
- `recipes`: `RecipeIngredient` has a nullable `ManyToOne` straight to `InventoryItem` (`onDelete: 'CASCADE'`) plus its own independent `quantity`/`unit` columns. Notably, `RecipeIngredient` does **not** reference `InventoryItemSize` at all — there is no DB-level or validator-level check that a recipe ingredient's `unit` is compatible with any of the item's defined `InventoryItemSize.unit`s, and `convertUnit`/`UnitConversionError` (`src/common/units/convert.ts`) currently has zero call sites anywhere under `src/modules` — unit reconciliation for recipe costing is not wired up yet.
- `inventory-areas`: `InventoryAreaItem` references both `InventoryItem` (`countedInventoryItem`) and `InventoryItemSize` (`countedItemSize`, `cascade: true`). This module reuses `InventoryItemSizeComposer` directly, so a brand-new `InventoryItemSize` can be created on the fly while recording an inventory count, without going through this module's own endpoints. `InventoryAreaItemValidator` also cross-validates via `enforceValidSize`, which loads the item's `sizes` relation and rejects a size id that doesn't belong to that item.
- `dynamic-properties` does not reference `InventoryItem` or any entity in this module at all — despite the name suggesting generic extensibility, inventory items have no dynamic-property support today.

`InventoryItem` does not participate in `revision-history` — there is no snapshot/change-log usage anywhere in this module, unlike `orders`.

Key relationships:
- `InventoryItem *—1 InventoryItemCategory` (nullable, `SET NULL` on delete) and `InventoryItem *—1 InventoryItemVendor` (nullable, `SET NULL` on delete)
- `InventoryItem 1—* InventoryItemSize` (cascade on the parent side; each `InventoryItemSize` also `ManyToOne InventoryItemPackage`, `onDelete: 'CASCADE'`)
- `RecipeIngredient *—1 InventoryItem` (cross-module; `onDelete: 'CASCADE'` — deleting an `InventoryItem` used as a recipe ingredient deletes the `RecipeIngredient` row, not just nulls it)
- `InventoryAreaItem *—1 InventoryItem` and `InventoryAreaItem *—1 InventoryItemSize` (cross-module; both `onDelete: 'CASCADE'`)

## Enforced Patterns

- **`name` uniqueness is enforced per-entity via `enforceUnique`, not just the DB `@Column({ unique: true })` constraint.** `InventoryItemValidator`, `InventoryItemCategoryValidator`, `InventoryItemPackageValidator`, and `InventoryItemVendorValidator` all call it in `validateIdentity`, returning a structured `ALREADY_EXISTS` (400) before any DB constraint would fire. This is an exact-match, case-sensitive comparison — `"Flour"` and `"flour"` both pass as unique.
- **`InventoryItemSize` has an application-level composite-uniqueness rule that the DB schema does not enforce.** `InventoryItemSizeValidator.validateIdentity` manually queries for an existing size with the same `unit` + `package.id` + `inventoryItem.id` + `measureAmount` and adds `ALREADY_EXISTS` (tagged `['unit', 'package', 'measureAmount']`) if found with a different id — you cannot create two sizes for the same item that are "10 lb in a Box" twice, but "10 lb in a Box" and "10 lb in a Bag" can coexist.
- **Sizes only ever get created/updated through a parent, never through their own controller.** `InventoryItemSizeController.create`/`update` both hard-code `throw new Error('Endpoint not available')`. The only legitimate ways to create/modify a size are: nested inside a `CreateInventoryItemDto`/`UpdateInventoryItemDto.sizes` array (via `InventoryItemSizeComposer`), or nested inside `inventory-areas`' count DTOs. Only `remove` is live on `InventoryItemSizeController`, and it manually invalidates **both** `InventoryItemService` and `InventoryAreaItemService` findAll caches — a newcomer adding a new size-mutating path must remember both cache namespaces, since `ControllerBase` only auto-invalidates its own service's cache.
- **Updating an `InventoryItem`'s `sizes` array is whole-array replacement, and omitting an existing size deletes it from the database (not a soft detach).** `InventoryItemService.updateEntity` reassigns `entity.sizes` from `composeManyNestedEntity`, which returns only the entities corresponding to DTOs present in the incoming array. Because `InventoryItemSize.inventoryItem` is declared with `orphanedRowAction: 'delete'`, any size previously attached but missing from `dto.sizes` is hard-deleted when `manager.save(entity)` runs — a caller sending a partial `sizes` array intending a "patch" will actually delete the sizes it left out.
- **`InventoryItemChangeDetector.detectSizes` does whole-array replacement too, but only when something actually changed** — matched existing sizes delegate to `InventoryItemSizeChangeDetector.detect`, and the entire nested-size list only becomes the patch once any size differs. `getUpdateDiffRelations()` returns `['category', 'vendor', 'sizes', 'sizes.package']` so `ServiceBase.update` can eager-load what the detector needs to short-circuit correctly. `ChangeDetectorBase.unchanged()` is a strict `===` comparison, so numeric strings vs numbers (e.g. `cost`) must be normalized by the entity-transformers before comparison, not by the detector itself.
- **Builders exist for every entity in this module but are effectively dead in production code paths.** Services use composers for create/update, not builders — the only consumer of the builders is the test-data seeding util. Don't assume `InventoryItemBuilder.build()` is on the live create/update path.
- **All five controllers are locked to `@Roles(ROLE_MANAGER, ROLE_ADMIN)`** — there is no read-only/staff-level access to any inventory-item endpoint, including simple lookups like categories/vendors/packages.
- **`InventoryItem` and its children do not participate in `revision-history`.** Unlike `Order`, there is no snapshot/change-log append on create or update here — deleting or overwriting a size via the whole-array-replacement behavior above is not recoverable through any revert mechanism in this module.

## Gotchas
