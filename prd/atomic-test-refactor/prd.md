# Atomic Test Refactor

## Problem Statement

The test suite uses a shared, pre-seeded database state per test file. All seeding happens in `beforeAll` using hardcoded name constants (e.g. `FOOD_A`, `FOOD_CAT`), and cleanup happens in `afterAll` via `DatabaseTestContext`. When any test throws before `afterAll` runs — or when a process is killed mid-run — named entities are left in the database. The next test run either hits a unique constraint trying to recreate them, or the idempotent seed check skips creation but also skips registering cleanup, orphaning the data permanently. This dirty-state problem makes the test suite unreliable after any failure.

Additionally, many tests find entities by querying `{ where: {} }` or `{ take: 1 }` rather than by a known ID, creating hidden ordering dependencies between tests within the same file. Tests that were intended to be independent are silently coupled through shared database state.

## Solution

Migrate all database-touching spec files to an atomic test pattern. The core change is a unique prefix per file (`P = t${Date.now()}`) applied to all entity names created by that file. This makes leftover state from any previous run invisible to subsequent runs — no naming conflicts regardless of whether cleanup executed. Combined with two-tier setup (reference data in `beforeAll`/`afterAll`, per-test data in `beforeEach`/`afterEach`) and entity lifecycle chains that reference entities by ID, tests become fully independent from each other and from prior runs.

The testing utils are updated to accept a prefix and return the created entities as typed objects, so callers reference seeded data by ID instead of re-querying the database by hardcoded name constants. Low-value tests that only verify TypeORM behavior (basic `findAll` counts, `sortBy` variants, `should be defined` assertions) are cut.

## User Stories

1. As a developer, I want test runs to succeed even when a previous run left entities in the database, so that I don't have to manually clear the DB after every failure.
2. As a developer, I want to run a single spec file repeatedly without it conflicting with data left by the same file's prior run, so that I can iterate quickly during development.
3. As a developer using an agent to implement a feature, I want the agent to follow a documented test pattern automatically, so that new test files are consistent without manual correction.
4. As a developer, I want each test to set up only the data it needs, so that test failures give clear, isolated error messages rather than cascading failures.
5. As a developer, I want to know exactly what data a test depends on by reading the test file alone, so that I don't have to trace through testing utils to understand a failure.
6. As a developer, I want the test suite to exclude tests that only verify framework behavior (TypeORM saves, NestJS DI resolves), so that failures in the suite indicate real regressions in business logic.
7. As a developer, I want `findAll` filter and search tests to assert that my entity appears in filtered results, so that the assertion is meaningful regardless of what other data is in the database.
8. As a developer, I want change detector short-circuit tests to live in the service spec, so that they test the behavior at the right layer without involving the HTTP controller.
9. As a developer, I want controller specs to focus on end-to-end wiring (validation propagation, remove lifecycle) rather than duplicating service spec coverage, so that controller tests only fail when there is a real wiring problem.
10. As a developer, I want `DatabaseTestContext` to remain available as a safety net for edge cases, so that tests with side-effect entities still have a reliable cleanup path.
11. As a developer, I want change detector specs to remain pure unit tests with no database or module bootstrap, so that they remain fast and runnable in any environment.

## Implementation Decisions

- **Unique prefix per file**: Every spec file that touches the database declares `const P = \`t${Date.now()}\`` at the top of the describe block. All entity names created by that file use this prefix (e.g. `${P}-food-cat`, `${P}-vendor-a`). This is the primary mechanism for preventing cross-run conflicts.

- **Two-tier setup structure**:
  - `beforeAll`: Bootstrap the NestJS testing module via `getXTestingModule()`. Create reference data (categories, vendors, packages — entities tests read but never mutate) with the unique prefix. Assign returned entities to describe-level variables.
  - `afterAll`: Delete reference data in FK-safe order using the IDs returned from `beforeAll`.
  - `beforeEach`: Instantiate a fresh `DatabaseTestContext` assigned to a describe-level variable.
  - `afterEach`: Call `testCtx.executeCleanupFunctions()` to clean up anything created by individual tests.

- **Entity lifecycle chains**: When testing create → update → delete on the same entity, use a shared variable within a nested `describe` block. Tests reference the entity by its ID — never by re-querying `{ where: {} }` or `{ take: 1 }`. The delete test serves as its own cleanup; no `DatabaseTestContext` registration needed for the lifecycle entity.

- **Testing util contract change**: Each `*-testing.util.ts` is updated to:
  - Accept a unique prefix `P` as a parameter
  - Create the entity dependency chain using `${P}`-prefixed names
  - Return all created entities as a typed object (e.g. `{ category, vendor, pkg, item }`)
  - Not register cleanup internally — the caller is responsible for cleanup via `afterAll` deletes or `DatabaseTestContext`

- **Testing modules unchanged**: All `getXTestingModule()` factory functions remain as-is. They continue to handle NestJS DI wiring, service class overrides, and the `RevisionHistoryService` mock option.

- **`DatabaseTestContext` role narrows**: Remains available and unchanged. Used as a safety net for entities created as side effects (e.g. nested entities created during a service call that aren't the primary entity under test). No longer the primary cleanup mechanism for most tests.

- **`findAll` filter/search assertion pattern**: Instead of comparing `service.findAll()` count to `repo.find()` count, tests create a known entity with a unique prefix, call the filtered `findAll`, and assert that the created entity appears in the results and that all returned items satisfy the filter predicate.

- **Change detector short-circuit test location**: Tests that spy on `updateEntity` to assert no-op behavior on unchanged DTOs move from controller specs into service specs. The spy on `ServiceClass.prototype` works identically from either location.

- **Controller spec scope**: Each controller spec is thinned to:
  - One test asserting a `ValidationException` is thrown when business rules are violated (verifies the validator is wired end-to-end)
  - A remove → `findOne` throws lifecycle (verifies delete wires through correctly)
  - Removal of all `findAll`, `findOne` happy path, and `sortBy` tests that duplicate service spec coverage

- **Tests to cut everywhere**:
  - `it('should be defined')` — NestJS DI failures surface in every other test
  - `findAll` count assertions against `repo.find()` — tests TypeORM, not domain logic
  - `findAll` sortBy variants — `ServiceBase` configuration, not domain code
  - `findOne` happy path in controller specs — covered by service spec

- **Tests to keep unchanged**: All `ChangeDetectorBase` spec files remain pure unit tests — plain object construction, no DB, no module bootstrap. No changes to these files.

## Testing Decisions

This PRD is itself a refactor of the test suite, so there are no new tests to write. The deliverable is the updated test files conforming to the pattern.

Correct application of the pattern can be verified by:
- Running a spec file, killing the process mid-run, then running it again — it should pass without a `clearTestDb` in between
- Running the full suite twice in a row without `clearTestDb` — the second run should pass cleanly
- Confirming no spec file outside of `change-detectors/` uses `{ where: {} }` or `{ take: 1 }` as the sole selector when referencing a specific entity

## Out of Scope

- Parallel test execution (schema-per-worker isolation) — this refactor is a prerequisite but does not implement parallel execution
- Rewriting change detector specs — they are already correct pure unit tests
- Changes to `*-testing.module.ts` factory functions — these are unchanged
- Changes to `DatabaseTestContext` implementation — its role narrows but its API stays the same
- E2E tests — only unit/integration specs under `src/` are in scope
- New feature coverage — this refactor does not add tests for untested behavior

## Further Notes

This refactor should be applied incrementally as spec files are touched for feature work, not as a single big-bang rewrite. The `CLAUDE.md` testing section already documents the target pattern so agents writing new test files will conform automatically. The priority order for applying the pattern to existing files: service specs first (highest value, most affected by dirty state), then validator specs, then controller specs.

The `seedTestDb` and `clearTestDb` npm scripts remain available but should be needed less frequently once the refactor is complete — the unique prefix makes manual DB clearing unnecessary after test failures.
