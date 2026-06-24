status: todo
blocked-by: [01-bootstrap-common-units.md]

---

## Source

prd/conversion-unit-prd.md

## What to build

Update `RecipeIngredient` and `InventoryItemSize` to replace their `UnitOfMeasure` FK relations with plain `AppUnit` varchar columns. This covers the full vertical slice for both entities: entity definition, DTOs, builders, validators, test seeding, and integration tests.

### Field renames
- `RecipeIngredient.quantityUnitType: UnitOfMeasure` (ManyToOne FK) → `RecipeIngredient.unit: AppUnit` (varchar column)
- `InventoryItemSize.measureType: UnitOfMeasure` (ManyToOne FK) → `InventoryItemSize.unit: AppUnit` (varchar column)

### For each entity
- Remove the `ManyToOne` relation and replace with a plain `@Column()` typed as `AppUnit`
- Update create/update DTOs: replace the numeric entity ID field with a string `unit` field validated with `@IsIn(Object.values(UNITS))`
- Update builders to accept `AppUnit` strings instead of entity IDs
- Update validators to remove any DB lookup for the unit relation (validation is now handled by `@IsIn` at the DTO level)
- Update change detectors if they reference the removed relation
- Update test seeding utilities to pass `AppUnit` strings instead of seeding `UnitOfMeasure` entities
- Update integration tests to assert the new field shape: `unit: 'kg'` instead of a nested `quantityUnitType` or `measureType` entity object

`synchronize: true` handles the schema change automatically — no migration file is needed.

## Acceptance criteria

- [ ] `RecipeIngredient.unit` is a varchar column storing an `AppUnit` string
- [ ] `InventoryItemSize.unit` is a varchar column storing an `AppUnit` string
- [ ] The old `quantityUnitType` and `measureType` FK columns are gone
- [ ] Create and update DTOs for both entities accept a `unit` string and reject invalid symbols with a validation error
- [ ] API responses for both entities include `unit` as a plain string, not a nested entity object
- [ ] Test seeding no longer seeds `UnitOfMeasure` entities
- [ ] All existing integration tests for `RecipeIngredient` and `InventoryItemSize` pass with the updated field shapes
