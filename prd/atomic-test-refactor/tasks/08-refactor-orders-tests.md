status: todo
blocked-by: [02-refactor-menu-items-tests.md]

---

## Source

`prd/atomic-test-refactor/prd.md`

## What to build

Migrate all `orders` spec files to the atomic test pattern and update `OrderTestingUtil` to use the updated `MenuItemTestingUtil` API. Orders is the largest and most complex domain: it has nested entities (order-menu-item, order-container-item), recurrence scheduling, and revision-history coverage.

**Prerequisite:** `02-refactor-menu-items-tests.md` must be complete. `MenuItemTestingUtil` methods now accept an optional `P` prefix and return typed objects. This task uses that updated API.

**Testing util changes (`src/modules/orders/utils/order-testing.util.ts`):**
Update calls to `MenuItemTestingUtil` methods to pass the `P` prefix received from the caller. Add an optional `P` parameter to this util's own public seed methods. Return created entities as typed objects; cleanup is the caller's responsibility.

**Note on `seed.service.ts`:** `seed.service.ts` imports `OrderTestingUtil`. Making `P` optional preserves that callsite. Verify the seed service still compiles and runs after the util change.

**Spec file changes (all 11 files: 6 service, 5 validator, 5 controller — covering `order`, `order-category`, `order-menu-item`, `order-container-item`, `order-recurrence`, `recurring-order-schedule`; plus 1 revision-history controller):**

- Add `const P = \`t${Date.now()}\`` at the top of each `describe` block.
- `beforeAll`: bootstrap the testing module + call the updated order testing util with `P` to create reference data (menu items, order categories, orders as needed). Assign returned entities to describe-level variables.
- `afterAll`: delete reference data by ID in FK-safe order (respecting the order FK chain: container-items → menu-items → orders → categories).
- `beforeEach` / `afterEach`: fresh `DatabaseTestContext` per test.
- Entity lifecycle tests use nested `describe` blocks with a shared `let entity` variable, referenced by ID.
- `findAll` filter/search tests: assert the known prefixed entity appears in results and satisfies the predicate. Pay attention to date-range filters in order queries — use values derived from the created order rather than hardcoded dates.
- Change detector short-circuit tests move from controller specs into service specs.
- Revision-history controller spec: keep tests that verify revision entries are written; remove `findAll`/`findOne`/sortBy duplication.
- Controller specs are thinned to: one `ValidationException` propagation test + remove → `findOne` throws lifecycle.
- Recurrence-related specs (order-recurrence, recurring-order-schedule) follow the same two-tier pattern; recurrence schedule entities are cleaned up via `DatabaseTestContext` if they are side-effect-created by the service.

**Tests to cut everywhere:**
- `should be defined` assertions
- `findAll` count-comparison assertions against `repo.find()`
- `sortBy` variants
- `findOne` happy path in controller specs

## Acceptance criteria

- [ ] `OrderTestingUtil` passes `P` to `MenuItemTestingUtil` methods and accepts its own optional `P` parameter; backward compatible with `seed.service.ts`
- [ ] Each of the 11 orders spec files declares `const P = \`t${Date.now()}\``
- [ ] No spec file queries entities with `{ where: {} }` or `{ take: 1 }` as the sole selector for a specific known entity
- [ ] `findAll` filter/search tests assert the prefixed entity appears in results
- [ ] Change detector short-circuit tests live in service specs only
- [ ] Controller specs contain only the ValidationException wiring test and remove → findOne lifecycle test
- [ ] All `should be defined`, count-comparison `findAll`, and `sortBy` tests are deleted
- [ ] `npm run test` passes for all orders spec files
- [ ] `npm run seedTestDb` still succeeds
