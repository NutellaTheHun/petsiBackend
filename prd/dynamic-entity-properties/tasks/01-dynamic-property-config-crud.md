status: done
blocked-by: []

---

## Source

`prd/dynamic-entity-properties/prd.md`

## What to build

A new `dynamic-properties` NestJS module that owns the `DynamicPropertyConfig` entity and exposes full CRUD for it. Managers use these endpoints to define named custom properties that can later be attached to menu items.

**Entity fields:**
- `holderEntityType` — string enum column, currently only `"menuItem"`; required
- `holderCategoryId` — nullable FK to `menu_item_categories`; null means the property applies to all items of that entity type
- `propertyName` — string; unique per `(holderEntityType, propertyName)`
- `valueType` — string enum: `"entityReference"` | `"filepath"`
- `valueEntityType` — nullable string, currently only `"menuItem"`; required when `valueType = "entityReference"`
- `valueEntityCategoryId` — nullable FK to `menu_item_categories`; null means any entity of that type is a valid value

`fieldRenderType` is **not stored**. It is derived in application code: `"entityReference"` → `"entity-select"`, `"filepath"` → `"file-upload"`. It must be included in all response DTOs.

The module follows the same patterns as other modules in `src/modules/` (entity, DTOs, builder, service, controller, testing module, validator). All config endpoints require `ROLE_MANAGER` or `ROLE_ADMIN`. The service must be exported so `menu-items` can import it in a later slice.

No mutability lock is implemented here — that is added in `05-dynamic-property-config-mutability-lock.md` once value rows exist to check against.

## Acceptance criteria

- [ ] `DynamicPropertyConfig` entity is persisted via TypeORM with all fields above; `holderCategoryId` and `valueEntityCategoryId` FK columns are SET NULL on category delete.
- [ ] `POST /dynamic-property-configs` creates a config and returns it with `fieldRenderType` derived from `valueType`.
- [ ] `GET /dynamic-property-configs` and `GET /dynamic-property-configs/:id` return configs including `fieldRenderType`.
- [ ] `PATCH /dynamic-property-configs/:id` allows updating any field (lock enforcement is a later slice).
- [ ] `DELETE /dynamic-property-configs/:id` removes the config.
- [ ] All endpoints return 403 for roles below `ROLE_MANAGER`.
- [ ] `propertyName` uniqueness is enforced per `holderEntityType`; duplicate returns a validation error.
- [ ] Service spec tests: create with valid fields persists and returns the config; duplicate `propertyName` per `holderEntityType` returns an error; delete removes the config.
- [ ] The module's testing module factory (`getDynamicPropertiesTestingModule`) follows the `*-testing.module.ts` pattern used in other modules.
