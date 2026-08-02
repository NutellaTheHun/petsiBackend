---
task: prd/multi-tenancy-support/tasks/06-user-role-userlocation.md
date: 2026-08-02
outcome: done
tags: [wrong-assumption]
tools-used: [Bash, Read, Edit, Write, ToolSearch, TaskOutput, Agent]
tools-requested-but-missing: []
modules-touched: [src/modules/users, src/modules/roles, src/modules/locations, src/modules/auth, src/modules/seed, src/common/swagger]
---

## What happened

Single continuous `/do-task multi-tenancy-support` run (no explicit task number in the invocation — the session auto-selected `06` per the lowest-numbered eligible task). Implementation followed the task file directly: `User` gained `tenantId`/`isTenantAdmin` and lost its direct `roles` M2M (`src/modules/users/entities/user.entities.ts`), `Role` gained `tenantId` and its M2M was repointed at the new `UserLocation` join entity (`src/modules/roles/entities/role.entity.ts`), and `UserLocation` was scaffolded from scratch in `src/modules/locations` (entity, service extending `LocationScopedServiceBase`, controller, validator, DTOs, change detector, builder-free test util) — full CRUD stack mirroring the existing module pattern. Both `UserService` and `RoleService` were moved onto `TenantScopedServiceBase`, and the `RoleModule`⇄`UserModule` circular `forwardRef` was removed since roles no longer reference `User` directly.

Verification ran in stages: per-module unit/integration suites (`src/modules/users`, `src/modules/roles`, `src/modules/locations`, `src/modules/auth`, `src/modules/seed`), then the full suite (`npx jest --runInBand`, 137 suites / 819 tests, all passing at the end), then `test/jest-e2e.json`. A background `Agent` (this debrief) was spawned as the task's final step per the skill.

## Deviations from plan

- **`AuthService` touched despite the task explicitly scoping that out** ("this slice does not... wire this into JWT/auth — that's slices 07/09's job"). Once `User.roles` was removed, `AuthService.signIn` no longer compiled, so `src/modules/auth/services/auth.service.ts` (+ `auth.module.ts`, `auth.service.spec.ts`, `auth-testing-module.ts`) was updated to source JWT role names from the caller's `UserLocation` assignments instead — self-flagged by the agent in its final summary as "a minimal exception... to keep it compiling and its existing spec passing," explicitly not adding tenant claims (left for task 07). This is a case of the task's stated slice boundary not holding against the actual dependency graph — `wrong-assumption` about how cleanly auth could stay untouched.
- `src/modules/seed/seed.service.ts` (+ spec) was updated to seed a fixture tenant/location and create `UserLocation` rows for the admin/manager/staff seed accounts — not called out in "What to build," but a necessary consequence of `Role`/`User` now requiring `tenantId` and roles moving off `User`.
- Swagger example fixtures (`src/common/swagger/examples/{locations/user-location,roles/role,users/user}.example.ts`) were updated to match the new shapes — mechanical, not a scope change.

## Friction points

- **Stale test-DB schema vs. a required-column migration** (`wrong-assumption`): the shared Postgres test DB had pre-existing seeded `role` rows (`admin`/`manager`/`staff`) from before `tenantId` was added as `NOT NULL`. Every attempt to let TypeORM's `synchronize: true` add the column against that populated table failed with `QueryFailedError: column "tenantId" of relation "role" contains null values`, cascading into 17 failing tests across `role.service.spec.ts`/`role.controller.spec.ts`/`role.validator.spec.ts` and a failing `npm run clearTestDb`. Root-caused via `psql \d role` / `select * from role` (confirmed 3 legacy rows), fixed by manually `TRUNCATE TABLE role CASCADE; TRUNCATE TABLE app_users CASCADE;` then re-running `clearTestDb`. After the fix, the full suite passed cleanly (819/819).
- **Same schema-drift issue recurred during e2e verification**, compounding into a slow-running-command problem: `npx jest --config test/jest-e2e.json --runInBand --testTimeout=30000` exceeded the 120s foreground timeout and was moved to background (task id `b4htv0qkn`); it was polled three times (120s/180s/240s timeouts, all returning `status: running`) before finally reporting `failed with exit code 1` roughly 14 minutes after starting. The agent killed the stuck jest processes, used `git stash` to test the e2e suite against a clean pre-task baseline (confirming a `/ (GET)` 404-vs-200 failure in `test/app.e2e-spec.ts` is pre-existing and unrelated to this task), stash-popped its changes back, and hit the identical `tenantId ... contains null values` error again on the reapplied code — requiring a second manual `TRUNCATE`/`clearTestDb` cycle before the e2e run completed (leaving only the pre-existing, confirmed-unrelated `/ (GET)` failure).
- Two trivial `Edit` failures (`tool_use_error: String to replace not found in file`) on `src/modules/locations/controllers/user-location.controller.ts` and `src/modules/roles/builders/role.builder.ts` — both indentation/whitespace mismatches between the assumed and actual file content, self-corrected on the next attempt with a re-read of the current content. Not tagged — single-retry, no wrong assumption behind it.
- No tool-permission gaps and no genuine mid-session human corrections — the only two "human" transcript entries are the initiating `/do-task multi-tenancy-support` command and the `do-task` skill body being loaded as context, not an interjection.
