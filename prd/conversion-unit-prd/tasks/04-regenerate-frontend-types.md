status: in-progress
blocked-by: [03-remove-unit-of-measure-module.md]

---

## Source

prd/conversion-unit-prd.md

## What to build

Run `npm run generate:types` to regenerate the frontend OpenAPI type definitions. The `unit` fields on `RecipeIngredient` and `InventoryItemSize` now return plain strings instead of nested entity objects, and the `UnitOfMeasure`/`UnitOfMeasureCategory` endpoint types are gone. The frontend type file must reflect this before frontend consumers can safely use the updated API.

The generate script writes to `../petsi-frontend/src/api-types.ts`. No manual edits to that file — it is entirely generated output.

## Acceptance criteria

- [ ] `npm run generate:types` runs without errors
- [ ] The generated `api-types.ts` reflects `unit` as a string field on `RecipeIngredient` and `InventoryItemSize` response types
- [ ] The generated `api-types.ts` no longer contains types for `UnitOfMeasure` or `UnitOfMeasureCategory` endpoints
