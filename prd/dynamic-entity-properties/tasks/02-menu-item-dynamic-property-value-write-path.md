status: done
blocked-by: [01-dynamic-property-config-crud.md]

---

## Source

`prd/dynamic-entity-properties/prd.md`

## What to build

A `MenuItemDynamicPropertyValue` join-table entity that stores one value per config per menu item, plus the write path that persists those values as part of the existing MenuItem create and update flows.

**Entity fields:**
- `menuItem` — ManyToOne to `MenuItem`, cascade delete on MenuItem delete
- `config` — ManyToOne to `DynamicPropertyConfig`, cascade delete on config delete
- `valueText` — nullable varchar; populated when `config.valueType = "filepath"`
- `valueEntityId` — nullable integer FK to `menu_items`; populated when `config.valueType = "entityReference"`; SET NULL when the referenced MenuItem is deleted
- Unique constraint on `(menuItemId, configId)`

**DTO change:** `CreateMenuItemDto` and `UpdateMenuItemDto` gain an optional `dynamicProperties: { configId: number; value: string | null }[]` field. A single `value` string carries the payload; the service routes it to `valueText` or `valueEntityId` based on the config's `valueType` (parse `value` as integer for `entityReference`).

**Update semantics in `MenuItemService`:**
- Entry absent from array → leave existing row untouched (no-op)
- `value: null` → delete the value row (clear)
- `value` non-null → upsert the value row

No validation of configId or value content is performed here — that is added in `03-menu-item-dynamic-property-validation.md`.

## Acceptance criteria

- [ ] `MenuItemDynamicPropertyValue` entity is persisted by TypeORM with the fields and constraints above; the unique index on `(menuItemId, configId)` is present.
- [ ] `POST /menu-items` with `dynamicProperties` persists value rows and they can be queried back from the database.
- [ ] `PATCH /menu-items/:id` with a non-null value upserts the value row.
- [ ] `PATCH /menu-items/:id` with `value: null` for a config deletes that value row.
- [ ] `PATCH /menu-items/:id` omitting a config from the array leaves its existing row unchanged.
- [ ] When a referenced MenuItem (the `valueEntityId` target) is deleted, the `valueEntityId` column becomes `null` (SET NULL) rather than cascading the delete.
- [ ] Service spec tests cover all four cases above (persist on create, upsert, null-clears, omit-leaves-unchanged, SET NULL).
- [ ] `MenuItemsModule` registers `MenuItemDynamicPropertyValue` with TypeORM and wires in the `DynamicPropertiesModule` import so `DynamicPropertyConfigService` is available.
