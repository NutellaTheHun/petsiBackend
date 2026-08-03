---
task: prd/multi-tenancy-support/tasks/08-roleguard-location-aware.md
date: 2026-08-02
outcome: done
tags: [clean, test-flakiness]
tools-used: [Bash, Read, Edit, Write, Agent]
tools-requested-but-missing: []
modules-touched: [src/common/decorators, src/modules/roles, src/modules/inventory-areas, src/modules/reports]
---

## What happened

Single straight pass, no retries or backtracking. Sequence: located the task file, confirmed it was the lowest-numbered eligible task (`blocked-by: 07`, done), read the PRD source sections, then read the current `role.guard.ts`, `AuthGuard`, and `AuthService` to confirm the post-slice-07 JWT payload shape (`{ sub, username, tenantId, isTenantAdmin, locations: {locationId, roles}[] }`). Noted along the way that `src/modules/auth/CLAUDE.md` still describes the old flat-`roles` model — flagged but not touched, out of scope.

No `role.guard.spec.ts` existed before this task, so it was written fresh rather than extended.

Implementation:
- **`src/common/decorators/LocationScope.ts`** (new) — `LocationScope(source, key = 'locationId')` decorator, `SetMetadata`-based, storing `{ source: 'params'|'query'|'body', key }` under `LOCATION_SCOPE_KEY`. Marks a route as location-bound and tells the guard where to pull the target `locationId` from.
- **`src/modules/roles/guards/role.guard.ts`** — rewritten: reads `@LocationScope` metadata via `Reflector`; if absent, checks tenant-wide (`isTenantAdmin` short-circuits true, else required role held at *any* `locations[].roles`); if present, extracts `locationId` from the configured request source and checks the role against that specific location's roles only.
- **`src/modules/inventory-areas/controllers/inventory-area.controller.ts`** — added `@LocationScope('body', 'locationId')` to `create`/`update`, proving the location-bound mode (both DTOs already carry `locationId`).
- **`src/modules/reports/controllers/report-definition.controller.spec.ts`** — updated its `token()` helper to sign the new `locations`-array JWT shape instead of the old flat `roles`, since the rewritten guard would otherwise reject it. This existing spec doubles as the tenant-wide-mode demonstration (no `@LocationScope` on its routes).

Verification: `npx jest --runInBand src/modules/roles/guards/role.guard.spec.ts` — 9/9 passed. `npx jest --runInBand src/modules/reports/controllers/report-definition.controller.spec.ts` — 7/7 passed. `npx tsc --noEmit -p tsconfig.json` — clean. Grepped for other `user.roles`/flat-roles call sites — none found outside what was already touched. Full `npm run test` — 138 suites / 830 tests passed. `npx eslint --fix` on the touched files failed with `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'typescript-eslint'`; confirmed pre-existing via `git stash && npx eslint --fix src/app.controller.ts` (an untouched file), which failed identically on the clean tree, then `git stash pop` restored the working changes.

At the end, spawned a background `Agent` running `/debrief-task multi-tenancy-support 08-roleguard-location-aware` per the skill's automatic-invocation step, then wrote a summary for the user including two unapplied `CLAUDE.md` suggestions (stale `src/modules/auth/CLAUDE.md`, and a suggested new bullet for `src/modules/roles/CLAUDE.md` documenting `@LocationScope`).

## Deviations from plan

None of substance. The task explicitly left "proven on at least one location-bound route and one tenant-wide route" open-ended (per the PRD's Further Notes); the session picked `InventoryAreaController.create`/`update` for location-bound and reused the existing `ReportDefinitionController` routes (already role-gated, no `@LocationScope` needed) for tenant-wide, rather than adding a new controller/route. This satisfies the acceptance criterion as written without expanding scope.

## Friction points

- **Pre-existing, unrelated lint breakage** (tag: `test-flakiness`) — `npx eslint --fix` on the touched files failed with `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'typescript-eslint'`. Verified via `git stash` + running eslint against an untouched file (`src/app.controller.ts`), which failed identically, then `git stash pop` to restore. Confirmed environment/dependency issue predating this task; same failure mode already logged in the `01`, `03`, `04`, and `07` debriefs for this PRD. No action taken beyond verification.
- No `is_error: true` tool results, no manual human corrections beyond the initial `/do-task multi-tenancy-support` invocation and a `/clear`, and no tool-permission gaps were found in the transcript — otherwise a clean, single-pass session from exploration through implementation, verification, and task-file bookkeeping.
