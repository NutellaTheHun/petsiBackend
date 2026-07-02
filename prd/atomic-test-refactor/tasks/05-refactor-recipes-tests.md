status: done
blocked-by: [01-refactor-inventory-items-tests.md]

---

## Source

`prd/atomic-test-refactor/prd.md`

## What to build

Migrate all `recipes` spec files to the atomic test pattern and update `recipe-test.util.ts` to use the updated `InventoryItemTestingUtil` API.

**Prerequisite:** `01-refactor-inventory-items-tests.md` must be complete. `InventoryItemTestingUtil` methods now accept an optional `P` prefix and return typed objects. This task uses that updated API.

**Testing util changes (`src/modules/recipes/utils/recipe-test.util.ts`):**
Update calls to `InventoryItemTestingUtil` methods to pass the `P` prefix received from the caller. Add an optional `P` parameter to this util's own public seed methods. Return created entities as typed objects; cleanup is the caller's responsibility.

**Spec file changes (all 8 files: 4 service, 4 validator — for `recipe`, `recipe-category`, `recipe-sub-category`, `recipe-ingredient`; plus 4 controller):**

- Add `const P = \`t${Date.now()}\`` at the top of each `describe` block.
- `beforeAll`: bootstrap the testing module + call the updated recipe test util with `P` to create reference data (inventory items, recipe categories, sub-categories as needed). Assign returned entities to describe-level variables.
- `afterAll`: delete reference data by ID in FK-safe order.
- `beforeEach` / `afterEach`: fresh `DatabaseTestContext` per test.
- Entity lifecycle tests use nested `describe` blocks with a shared `let entity` variable, referenced by ID.
- `findAll` filter/search tests: assert the known prefixed entity appears in results and satisfies the predicate.
- Change detector short-circuit tests move from controller specs into service specs.
- Controller specs are thinned to: one `ValidationException` propagation test + remove → `findOne` throws lifecycle.

**Tests to cut everywhere:**
- `should be defined` assertions
- `findAll` count-comparison assertions against `repo.find()`
- `sortBy` variants
- `findOne` happy path in controller specs

## Acceptance criteria

- [x] `recipe-test.util.ts` passes `P` to `InventoryItemTestingUtil` methods and accepts its own optional `P` parameter
- [x] Each recipes spec file declares `const P = \`t${Date.now()}\``
- [x] No spec file queries entities with `{ where: {} }` or `{ take: 1 }` as the sole selector for a specific known entity
- [x] `findAll` filter/search tests assert the prefixed entity appears in results
- [x] Change detector short-circuit tests live in service specs only
- [x] Controller specs contain only the ValidationException wiring test and remove → findOne lifecycle test (recipe-sub-category and recipe-ingredient controllers have their create/update endpoints disabled — `throw new Error('Endpoint not available')`, not routed through the validator — so those two specs contain only the remove → findOne lifecycle test; see deviation note)
- [x] All `should be defined`, count-comparison `findAll`, and `sortBy` tests are deleted
- [x] `npm run test` passes for all recipes spec files
