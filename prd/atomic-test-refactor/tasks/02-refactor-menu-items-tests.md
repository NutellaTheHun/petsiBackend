status: todo
blocked-by: []

---

## Source

`prd/atomic-test-refactor/prd.md`

## What to build

Migrate all `menu-items` spec files to the atomic test pattern and update `MenuItemTestingUtil` — which is a shared dependency consumed by the labels, templates, and orders testing utils, so this task unblocks those three downstream tasks.

**Testing util changes (`src/modules/menu-items/utils/menu-item-testing.util.ts`):**
Add an optional `P` prefix parameter to each public seed method. When provided, all entity names are created as `${P}-<name>`; when omitted, behavior is unchanged (backward compatible with `seed.service.ts`, which imports this util and passes no prefix). Each method returns the created entities as a typed object; cleanup is the caller's responsibility.

**Spec file changes (all 13 files: 4 service, 4 validator, 4 controller, 1 revision-history controller):**

- Add `const P = \`t${Date.now()}\`` at the top of each `describe` block.
- `beforeAll`: bootstrap the testing module + call updated util methods with `P` to create reference data (categories, sizes, menu items). Assign returned entities to describe-level variables.
- `afterAll`: delete reference data by ID in FK-safe order.
- `beforeEach` / `afterEach`: fresh `DatabaseTestContext` per test.
- Entity lifecycle tests use nested `describe` blocks with a shared `let entity` variable, referenced by ID.
- `findAll` filter/search tests: assert the known prefixed entity appears in results and satisfies the predicate.
- Change detector short-circuit tests move from controller specs into service specs.
- Controller specs are thinned to: one `ValidationException` propagation test + remove → `findOne` throws lifecycle.
- Revision-history controller spec: keep tests that verify revision entries are written; remove any `findAll`/`findOne`/sortBy tests that duplicate service coverage.

**Tests to cut everywhere:**
- `should be defined` assertions
- `findAll` count-comparison assertions against `repo.find()`
- `sortBy` variants
- `findOne` happy path in controller specs

**Note on `seed.service.ts`:** This file imports `MenuItemTestingUtil`. Making `P` optional preserves that callsite. Verify the seed service still compiles and runs after the util change.

## Acceptance criteria

- [ ] `MenuItemTestingUtil` seed methods accept an optional `P` prefix; backward compatible with `seed.service.ts`
- [ ] Each of the 13 menu-items spec files declares `const P = \`t${Date.now()}\``
- [ ] No spec file queries entities with `{ where: {} }` or `{ take: 1 }` as the sole selector for a specific known entity
- [ ] `findAll` filter/search tests assert the prefixed entity appears in results
- [ ] Change detector short-circuit tests live in service specs only
- [ ] Controller specs contain only the ValidationException wiring test and remove → findOne lifecycle test
- [ ] All `should be defined`, count-comparison `findAll`, and `sortBy` tests are deleted
- [ ] `npm run test` passes for all menu-items spec files
- [ ] `npm run seedTestDb` still succeeds
