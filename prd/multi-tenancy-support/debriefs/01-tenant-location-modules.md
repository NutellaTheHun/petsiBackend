---
task: prd/multi-tenancy-support/tasks/01-tenant-location-modules.md
date: 2026-07-24
outcome: done
tags: [wrong-assumption, ambiguous-instruction]
tools-used: [Agent, Bash, Edit, Read, Write]
tools-requested-but-missing: []
modules-touched: [src/modules/tenants, src/modules/locations]
---

## What happened

The agent selected task 01 (only eligible `todo` task, no blockers), set it `in-progress`, then surveyed reference modules before writing anything: `inventory-areas` (simple CRUD pattern), `labels`/`label-type` (two-entity FK relationship, modeled for `Location -> Tenant`), the base-class hierarchy (`ServiceBase`, `ControllerBase`, `ValidatorBase`, `EntityBase`), `roles` (constants, `PublicRole` decorator, spec conventions), and the testing/DB-context wiring.

Built the `tenants` module first: entity, DTOs, validator (`enforceUnique` on `subdomain`), builder, service, change-detector, entity-transformer, controller (gated `@Roles(ROLE_ADMIN)`), swagger example, test util, module, testing module, and specs (service/validator/controller/change-detector). Typechecked and ran its tests clean before starting `locations`.

Built `locations` next, same stack, with `LocationValidator` enforcing the `tenantId` FK exists via `enforceExists`. Mid-write, the agent caught and fixed a `require()` call in `location.service.ts` that didn't match the codebase's import style, replacing it with a proper `import { Tenant } from '../../tenants/entities/tenant.entity'` (no error forced this — a self-review catch).

Registered both modules in `app.module.ts` (root wiring only). First full-project `tsc` run surfaced a real type error (see Friction). After fixing it, `tsc` was clean, `npx jest --runInBand src/modules/tenants src/modules/locations` passed 31/31, and the full suite (`npm run test`) passed all 759 tests with no regressions. `npm run build` also passed. `npx eslint --fix` failed environment-wide (`Cannot find package 'typescript-eslint'`) — the agent correctly identified this as pre-existing and unrelated to the change, not something to fix in this slice.

## Deviations from plan

**Controller role-gating not specified by the task** — the task file says nothing about `@Roles(...)` for the new `TenantController`/`LocationController`. The agent chose `@Roles(ROLE_ADMIN)` on both, following the precedent set by `RoleController` for other administrative/meta entities, since the PRD doesn't define tenant-admin semantics until slices 07–09 (auth JWT tenant claims, roleguard location-aware). Flagged explicitly by the agent in its own final summary as a judgment call rather than a spec-derived decision.

No other deviations — all six acceptance criteria were implemented as written, and no existing module's imports or entities were touched (only `src/app.module.ts` for registration, per plan).

## Friction points

**1. `LocationController.findAll` signature mismatch (wrong-assumption)**
First full-project `npx tsc --noEmit` run failed with TS2416: `LocationController.findAll`'s override wasn't assignable to `ControllerBase<LocationEntity>`'s — the base signature expects `search?: string` before `filters?: string[]`, but the first draft omitted `search` entirely. The agent's first `Edit` attempt still didn't match exactly; it then grepped `InventoryAreaCountController` (a controller confirmed to support `filters`) for its exact `findAll` param order and `@ApiQuery` decorators, copied that shape verbatim, and re-ran `tsc` clean. Two edit passes on `location.controller.ts` were needed before the signature matched the base class.

**2. Two trivial self-corrected tool errors, no impact on outcome**
- `Read` on `src/common/base` (a directory, not a file) → `EISDIR: illegal operation on a directory`. Immediately retried with `ls` instead, then read `src/common/base/CLAUDE.md` directly.
- `grep -n "EntityId" src/common/types.ts` → file doesn't exist at that path. Immediately retried with `grep -rln "export type EntityId" src/` and found the real location (`src/common/types/entity-id.type.ts`).
Neither slowed the build meaningfully; both were resolved in the very next tool call.

**3. Environment-level lint breakage, not a code issue**
`npx eslint --fix` errored with `ERR_MODULE_NOT_FOUND: Cannot find package 'typescript-eslint'` across the whole repo (not scoped to the new modules). The agent correctly attributed this to the environment rather than the change and proceeded to rely on `tsc` + the full test suite instead.
