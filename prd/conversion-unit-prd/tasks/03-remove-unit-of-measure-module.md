status: todo
blocked-by: [02-migrate-unit-fields.md]

---

## Source

prd/conversion-unit-prd.md

## What to build

Delete the `unit-of-measure` NestJS module in its entirety and remove all references to it from the rest of the application. By this point, `RecipeIngredient` and `InventoryItemSize` no longer reference `UnitOfMeasure` entities, so the module can be safely removed.

### What to delete
- The entire `src/modules/unit-of-measure/` directory: entities, services, controllers, DTOs, validators, builders, change detectors, testing utilities, spec files, and Swagger examples
- Remove `UnitOfMeasureModule` from `AppModule` imports
- Remove any remaining imports of `UnitOfMeasure`, `UnitOfMeasureCategory`, or anything from the `unit-of-measure` module across the codebase (recipes module, inventory modules, seed module, etc.)

### What to verify
After deletion, the application should compile cleanly with no references to the removed module. All remaining tests should pass.

## Acceptance criteria

- [ ] `src/modules/unit-of-measure/` directory is deleted
- [ ] `UnitOfMeasureModule` is removed from `AppModule`
- [ ] No remaining imports of `UnitOfMeasure`, `UnitOfMeasureCategory`, or the `unit-of-measure` module anywhere in the codebase
- [ ] `npm run build` completes without errors
- [ ] `npm run test` passes (all remaining tests)
