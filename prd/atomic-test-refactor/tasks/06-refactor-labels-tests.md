status: todo
blocked-by: [02-refactor-menu-items-tests.md]

---

## Source

`prd/atomic-test-refactor/prd.md`

## What to build

Migrate all `labels` spec files to the atomic test pattern and update `LabelTestingUtil` to use the updated `MenuItemTestingUtil` API.

**Prerequisite:** `02-refactor-menu-items-tests.md` must be complete. `MenuItemTestingUtil` methods now accept an optional `P` prefix and return typed objects. This task uses that updated API.

**Testing util changes (`src/modules/labels/utils/label-testing.util.ts`):**
Update calls to `MenuItemTestingUtil` methods to pass the `P` prefix received from the caller. Add an optional `P` parameter to this util's own public seed methods. Return created entities as typed objects; cleanup is the caller's responsibility.

**Note on `seed.service.ts`:** `seed.service.ts` imports `LabelTestingUtil`. Making `P` optional preserves that callsite. Verify the seed service still compiles and runs after the util change.

**Spec file changes (all 6 files: 2 service, 2 validator, 2 controller — for `label` and `label-type`):**

- Add `const P = \`t${Date.now()}\`` at the top of each `describe` block.
- `beforeAll`: bootstrap the testing module + call the updated label testing util with `P` to create reference data (label types, menu items if needed). Assign returned entities to describe-level variables.
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

- [ ] `LabelTestingUtil` passes `P` to `MenuItemTestingUtil` methods and accepts its own optional `P` parameter; backward compatible with `seed.service.ts`
- [ ] Each of the 6 labels spec files declares `const P = \`t${Date.now()}\``
- [ ] No spec file queries entities with `{ where: {} }` or `{ take: 1 }` as the sole selector for a specific known entity
- [ ] `findAll` filter/search tests assert the prefixed entity appears in results
- [ ] Change detector short-circuit tests live in service specs only
- [ ] Controller specs contain only the ValidationException wiring test and remove → findOne lifecycle test
- [ ] All `should be defined`, count-comparison `findAll`, and `sortBy` tests are deleted
- [ ] `npm run test` passes for all labels spec files
- [ ] `npm run seedTestDb` still succeeds
