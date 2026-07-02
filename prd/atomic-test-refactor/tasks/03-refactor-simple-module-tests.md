status: done
blocked-by: []

---

## Source

`prd/atomic-test-refactor/prd.md`

## What to build

Migrate spec files for three self-contained modules — `roles`, `users`, and `dynamic-properties` — to the atomic test pattern. None of these modules have a shared `*-testing.util.ts` that other modules depend on, so this task has no blockers and unblocks nothing.

**Modules in scope:**
- `src/modules/roles/` — 3 spec files (service, validator, controller)
- `src/modules/users/` — 3 spec files (service, validator, controller)
- `src/modules/dynamic-properties/` — 1 spec file (service)

**Spec file changes (all 7 files):**

- Add `const P = \`t${Date.now()}\`` at the top of each `describe` block.
- `beforeAll`: bootstrap the testing module + create any reference data (e.g., role names, user records) using `${P}`-prefixed names. Assign returned entities to describe-level variables with their IDs.
- `afterAll`: delete reference data by ID in FK-safe order.
- `beforeEach` / `afterEach`: fresh `DatabaseTestContext` per test.
- Entity lifecycle tests (create → update → delete) use a nested `describe` block with a shared `let entity` variable, referenced by ID.
- `findAll` filter/search tests: create a known prefixed entity, call the filtered `findAll`, assert the entity appears in results and all returned items satisfy the predicate.
- Change detector short-circuit tests: if any currently live in controller specs, move them to the corresponding service spec.
- Controller specs are thinned to: one `ValidationException` propagation test + remove → `findOne` throws lifecycle. Remove all `findAll`, `findOne` happy path, and `sortBy` tests.

**Tests to cut everywhere:**
- `should be defined` assertions
- `findAll` count-comparison assertions against `repo.find()`
- `sortBy` variants
- `findOne` happy path in controller specs

## Acceptance criteria

- [x] Each of the 7 spec files declares `const P = \`t${Date.now()}\``
- [x] No spec file queries entities with `{ where: {} }` or `{ take: 1 }` as the sole selector for a specific known entity
- [x] `findAll` filter/search tests assert the prefixed entity appears in results (not a count comparison)
- [x] Change detector short-circuit tests live in service specs only
- [x] Controller specs contain only the ValidationException wiring test and remove → findOne lifecycle test
- [x] All `should be defined`, count-comparison `findAll`, and `sortBy` tests are deleted
- [x] `npm run test` passes for all 7 spec files
