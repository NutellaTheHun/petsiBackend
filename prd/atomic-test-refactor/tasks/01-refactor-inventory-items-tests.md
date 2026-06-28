status: todo
blocked-by: []

---

## Source

`prd/atomic-test-refactor/prd.md`

## What to build

Migrate all `inventory-items` spec files to the atomic test pattern and update the `InventoryItemTestingUtil` contract to enable that migration.

**Testing util changes (`src/modules/inventory-items/utils/inventory-item-testing.util.ts`):**
Add a `P` (unique prefix) parameter to each public seed method — make it optional with an empty-string default so the `seed.service.ts` caller (which passes no prefix and relies on hardcoded constant names) is not broken. When `P` is provided, all entity names are created as `${P}-<name>` instead of the constant. Each method returns the created entities as a typed object rather than registering cleanup internally — cleanup is the caller's responsibility via `afterAll` deletes or `DatabaseTestContext`.

**Spec file changes (all 15 files: 5 service, 5 validator, 5 controller):**

- Add `const P = \`t${Date.now()}\`` at the top of each `describe` block.
- `beforeAll`: bootstrap the testing module + call the updated util methods with `P` to create reference data (categories, vendors, packages, items, sizes as needed). Assign returned entities to describe-level variables and store their IDs for cleanup.
- `afterAll`: delete reference data by ID in FK-safe order (sizes → items → categories/vendors/packages).
- `beforeEach`: instantiate a fresh `DatabaseTestContext`.
- `afterEach`: call `testCtx.executeCleanupFunctions()`.
- Entity lifecycle tests (create → update → delete) move into nested `describe` blocks with a shared `let entity` variable; reference the entity by ID, never by re-querying `{ where: {} }` or `{ take: 1 }`.
- `findAll` filter/search tests: assert the known prefixed entity appears in results and that all returned items satisfy the predicate — not a count comparison against `repo.find()`.
- Change detector short-circuit tests (`updateEntity` not called when DTO matches entity) move from controller specs into service specs.
- Controller specs are thinned to: one `ValidationException` propagation test + the remove → `findOne` throws lifecycle. All `findAll`, `findOne` happy path, `sortBy`, and duplicate change-detector tests are removed.

**Tests to cut everywhere:**
- `it('should be defined')` assertions
- `findAll` count assertions that compare service results to `repo.find()` length
- `findAll` sortBy variants
- `findOne` happy path in controller specs

**Note on `seed.service.ts`:** This file imports `InventoryItemTestingUtil` to populate the dev/test DB. Making `P` optional preserves that callsite. Verify the seed service still compiles and runs (`npm run seedTestDb`) after the util change.

## Acceptance criteria

- [ ] `InventoryItemTestingUtil` seed methods accept an optional `P` prefix; when provided, all created entity names are `${P}`-prefixed; when omitted, behavior is unchanged (backward compatible with `seed.service.ts`)
- [ ] Each of the 15 inventory-items spec files declares `const P = \`t${Date.now()}\``
- [ ] No spec file queries entities with `{ where: {} }` or `{ take: 1 }` as the sole selector for a specific known entity
- [ ] `findAll` filter/search tests assert the prefixed entity appears in results (not a count comparison)
- [ ] Change detector short-circuit tests live in the service spec, not the controller spec
- [ ] Controller specs contain only the ValidationException wiring test and remove → findOne lifecycle test
- [ ] All `should be defined`, count-comparison `findAll`, and `sortBy` tests are deleted
- [ ] `npm run test` passes for all inventory-items spec files
- [ ] `npm run seedTestDb` still succeeds (seed service not broken)
