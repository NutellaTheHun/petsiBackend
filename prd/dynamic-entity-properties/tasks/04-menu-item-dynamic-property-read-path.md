status: todo
blocked-by: [02-menu-item-dynamic-property-value-write-path.md]

---

## Source

`prd/dynamic-entity-properties/prd.md`

## What to build

Every MenuItem response — `findOne` and `findAll` — must include an inline `dynamicProperties` array so the frontend has full config metadata alongside the value without a separate fetch. Items with no applicable configs return an empty array.

**Shape of each element:**

```
{
  configId:             number,
  propertyName:         string,
  fieldRenderType:      "entity-select" | "file-upload",   // derived, not stored
  valueType:            "entityReference" | "filepath",
  valueEntityType:      string | null,
  valueEntityCategoryId: number | null,
  value:                string | null  // entityReference: entity id as string; filepath: path string
}
```

This requires:
- Eager-loading `MenuItemDynamicPropertyValue` rows (with their `config` relation) in `getUpdateDiffRelations` / `getSnapshotRelations` so the data is available at transform time.
- Updating the MenuItem entity transformer to map these rows to the response shape above.
- Adding `dynamicProperties: MenuItemDynamicPropertyValue[]` to the `MenuItem` entity as a `OneToMany` relation.

The `fieldRenderType` derivation mirrors the rule in slice 1: `"entityReference"` → `"entity-select"`, `"filepath"` → `"file-upload"`.

## Acceptance criteria

- [ ] `GET /menu-items/:id` response includes a `dynamicProperties` array with all fields above for each value row that exists.
- [ ] `GET /menu-items` response includes `dynamicProperties` on each item in the list.
- [ ] A MenuItem with no value rows (or no applicable configs) returns `dynamicProperties: []`.
- [ ] `value` is `null` when `valueEntityId` is null (SET NULL case from slice 2) rather than omitted.
- [ ] Controller spec tests cover `findOne` with populated values, `findAll` with populated values, and the empty-array case.
