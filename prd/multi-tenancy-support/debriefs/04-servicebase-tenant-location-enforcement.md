---
task: prd/multi-tenancy-support/tasks/04-servicebase-tenant-location-enforcement.md
date: 2026-07-25
outcome: done-with-deviations
tags: [wrong-assumption, clean]
tools-used: [Bash, Read, Edit, Write, ToolSearch, TaskCreate, TaskUpdate, Agent]
tools-requested-but-missing: []
modules-touched: [src/common/base, src/common/validation, src/modules/orders, src/modules/inventory-areas, src/modules/locations, src/modules/seed]
---

## What happened

Task selected via `/do-task multi-tenancy-support`; task `04` was the next `todo` item with both blockers (`01`, `02`) satisfied. Investigation phase (`Read`/`Bash`) covered the PRD's "ServiceBase enforcement"/"Testing Decisions" sections, `src/common/base/CLAUDE.md`, the full `service.base.ts`, the `OrderCategory`/`InventoryArea` modules, and the `Tenant`/`Location` entities from task `01`, plus existing `enforceUnique`/`applyFilters` patterns and one existing `ForbiddenException` usage (`report-execution.service.ts`) to match conventions. Work was tracked via five self-created `TaskCreate` items (entity/service/validator scoping and module-wiring/spec-updates, split per entity, plus a final "run full suite and fix fallout" item), each moved through `in_progress`→`completed`.

Implementation, in order:
- `service.base.ts` — added an unconditional `applyScope` hook to `findAll` (distinct from the existing conditional `applyFilters`/`applySearch`/`applyDate` hooks, since tenant/location filtering must never depend on caller input).
- `tenant-scoped-service.base.ts` / `location-scoped-service.base.ts` (new) — the two intermediate classes, overriding `create`/`findOne`/`update`/`remove`/`applyScope`, calling `super.<method>()` and layering scoping around it, per the task's explicit note that this contradicts the "domain services only touch lifecycle hooks" convention.
- `ValidatorHelper.enforceUnique` — added an optional `scope` param; `ValidatorBase.requestContextService` promoted to `protected`.
- `OrderCategory` → `TenantScopedServiceBase`: `tenantId` column, `(tenantId, name)` scoped uniqueness, module wiring (`TenantsModule` import), full spec rewrite (service/validator/controller).
- `InventoryArea` → `LocationScopedServiceBase`: `tenantId`/`locationId` columns, `(tenantId, locationId, name)` scoped uniqueness, DTO/builder/change-detector/entity-transformer updates, module wiring (`TenantsModule`+`LocationsModule`), full spec rewrite.

Verification: `npx tsc --noEmit` after each entity, targeted jest runs per entity, then full module suites (`src/modules/orders`, `src/modules/inventory-areas` — all passing on first try), then `npm run test` (785 tests) — which surfaced the one real piece of friction (see Deviations). After the fix, a second full `npm run test` passed clean (133 suites / 785 tests). `npm run lint` failed outright with `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'typescript-eslint'` — recognized as a pre-existing broken dependency unrelated to this change (consistent with task `03`'s debrief hitting the identical error) and substituted with `npm run build`, which passed clean. A final acceptance-criteria pass added one missing spec case (`findAll with an authorized locationId filter returns only that location's areas`, `inventory-area.service.spec.ts`) before marking the task `done` and spawning this debrief agent.

## Deviations from plan

The task's "atomic tests with unique prefix" convention (each spec file provisions its own reference data under a unique `${P}` prefix) collided with `seed.service.spec.ts`'s "seed the entire database, then assert non-empty results" test, which calls `inventoryAreaService.findAll()`/`orderCategoryService.findAll()` with no request context. Once those services became tenant-scoped, both calls threw `NotFoundException` (`npm run test` output: `NotFoundException: Not Found` at the tenant-id check in the new base class) — a real regression caused by this task's own change, not a pre-existing flake.

Fix, not specified anywhere in the task file: switched `OrderTestingUtil`/`InventoryAreaTestUtil` from "provision a fresh tenant/location per call" to a lazily-created, idempotent **shared fixture tenant/location** (`getDefaultTenantId()` / `getDefaultLocation()`, both promoted from `private` to `public` so `seed.service.spec.ts` could reach them), then updated `seed.service.spec.ts` to inject `InventoryAreaTestUtil`, `OrderTestingUtil`, and `TestRequestContextService`, and call `requestContext.setContext({ tenantId, isTenantAdmin: true })` (inventory areas) / `requestContext.setContext({ tenantId })` (order categories) immediately before each `findAll()` call. This is a legitimate design decision made mid-session, not dictated by the task file — worth `review-debrief` flagging if later slices (`11`/`12`) hit the same seed-spec collision repeatedly, since the fix pattern (shared fixture entity + explicit context-set around a `findAll` call) will likely need repeating for every entity the seed spec touches.

No other deviations — all five acceptance criteria were met as specified, and no other domain entity was migrated in this slice.

## Friction points

- **`wrong-assumption`** — the existing test-fixture convention (unique tenant/location per spec file) was assumed compatible with `seed.service.spec.ts`'s cross-cutting "entire database" assertions; it wasn't, once `findAll` became tenant/location-scoped. Caught by the full-suite run, not by a targeted test, since the module-level suites for `orders`/`inventory-areas` alone had no reason to exercise the seed module. Fixed as described above; confirmed by a clean rerun of the full suite.
- Pre-existing, unrelated: `npm run lint` is broken in this environment (`typescript-eslint` package missing) — matches the identical failure recorded in task `03`'s debrief, so not re-litigated; `npm run build` used as the substitute gate.
- No tool errors (permission-denied or otherwise) and no genuine mid-session human interjections — the only `user`-role string messages were `/clear`/`do-task` slash-command boilerplate.
