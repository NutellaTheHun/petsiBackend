status: todo
blocked-by: [01-dynamic-property-config-crud.md, 02-menu-item-dynamic-property-value-write-path.md]

---

## Source

`prd/dynamic-entity-properties/prd.md`

## What to build

Extend `DynamicPropertyConfigService.update` (or the update validator) to lock structural fields once any `MenuItemDynamicPropertyValue` row exists for the config being updated. `propertyName` remains freely editable at all times.

**Locked fields (return 409 if any value rows exist and the caller tries to change them):**
- `holderEntityType`
- `holderCategoryId`
- `valueType`
- `valueEntityType`
- `valueEntityCategoryId`

The check is: query whether any `MenuItemDynamicPropertyValue` with `configId = id` exists; if yes and the DTO differs on any locked field, return 409. If the DTO does not include a locked field (i.e., it is absent / `undefined`), treat it as no-change and allow the update through.

## Acceptance criteria

- [ ] `PATCH /dynamic-property-configs/:id` renaming `propertyName` succeeds even when value rows exist.
- [ ] `PATCH /dynamic-property-configs/:id` changing any locked field when at least one value row exists returns HTTP 409.
- [ ] `PATCH /dynamic-property-configs/:id` changing a structural field when no value rows exist succeeds.
- [ ] Service spec tests cover all three cases above.
