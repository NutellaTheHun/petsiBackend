---
task: prd/multi-tenancy-support/tasks/09-tenant-provisioning-script.md
date: 2026-08-03
outcome: done
tags: [ambiguous-instruction, test-flakiness]
tools-used: [Bash, Read, Edit, Write, Agent]
tools-requested-but-missing: []
modules-touched: [src/modules/tenant-provisioning, src/scripts/db]
---

## What happened

Single pass, no retries or backtracking on the implementation itself. Sequence: confirmed 09 was the lowest-numbered eligible `todo` task (`blocked-by: 06, 07`, both done — 10/11/12/13 were also eligible but higher-numbered), marked it `in-progress`, read the PRD source paragraph and the existing `seed`/`tenants`/`locations`/`users`/`roles`/`auth` modules plus `RequestContextService` and `TenantResolutionMiddleware` for pattern reference.

Mid-implementation, spawned a foreground research `Agent` ("Find TestRequestContextService and tenant-provisioning-relevant test patterns") to answer a real open question: the script runs via `NestFactory.createApplicationContext(AppModule)` outside any HTTP request, but `RoleService`/`UserService` extend `TenantScopedServiceBase` and read `tenantId` off the real `cls-hooked`-based `RequestContextService`. The agent's job was to find whether any existing code establishes a CLS context outside of an HTTP request (`requestContextService.run(...)`) that the script could reuse as a pattern. This produced the design used in `tenant-provisioning.service.ts`.

Built:
- `src/modules/tenant-provisioning/tenant-provisioning.service.ts` — `provisionTenant()`: creates `Tenant` → first `Location` → per-tenant `admin`/`manager`/`staff` `Role` rows → a tenant-admin `User` (bcrypt-hashed password, `isTenantAdmin: true`).
- `src/modules/tenant-provisioning/tenant-provisioning.module.ts`, `utils/tenant-provisioning-testing.module.ts`, `tenant-provisioning.service.spec.ts` (exercises `AuthService.signIn` too, to prove the acceptance criterion that the new admin can log in).
- `src/scripts/db/provisionTenant.ts` — CLI entry point mirroring `seedTestDb.ts`'s `NODE_ENV=development` + `NestFactory.createApplicationContext` pattern.
- Wired into `src/app.module.ts` (`TenantProvisioningModule`, alphabetical import placement) and `package.json` (`"provisionTenant": "NODE_ENV=development ts-node src/scripts/db/provisionTenant.ts"`).

Verification: new spec passed (`npx jest --runInBand .../tenant-provisioning.service.spec.ts`), `npx tsc --noEmit` clean, then ran the actual CLI twice against the real test DB — once to provision a live tenant end-to-end, once with a duplicate subdomain to confirm the "Error: A tenant with subdomain ... already exists" rejection (exit 0, from Nest's own error logging, not a shell failure). Cleaned up the smoke-test DB rows with a one-off script written first to the scratchpad (failed — `ts-node` couldn't resolve `@nestjs/core`/relative `src` imports from outside the project root), then rewritten as `src/scripts/db/_tmp_cleanup_smoke.ts` inside the project (succeeded), and deleted afterward. Ran the broader `tenants`/`locations`/`roles`/`users`/`auth`/`TenantResolutionMiddleware` suites and the full `npm run test` for regressions.

## Deviations from plan

The task's "What to build" flagged an open question directly: whether `isTenantAdmin: true` still requires a `UserLocation` row for the first location, or whether tenant-wide admin bypasses per-location assignment entirely (task text: "confirm which shape `isTenantAdmin` implies for `UserLocation` rows before assuming one is required"). The session resolved this by reading `LocationScopedServiceBase.isLocationAuthorized` and concluded `isTenantAdmin` alone grants access to every location under the tenant — so the provisioned admin gets **no `UserLocation` row**. This is recorded as a comment in `tenant-provisioning.service.ts:40-42` citing the exact mechanism relied on. No other deviation from the task's stated shape (tenant → location → per-tenant roles → tenant-admin user, single script invocation, no HTTP endpoint).

## Friction points

- **Pre-existing, unrelated test failures** (tag: `test-flakiness`) — `src/modules/tenants/services/tenant.service.spec.ts` ("should find seeded tenant in findAll results") and `src/modules/seed/seed.service.spec.ts` ("should seed the entire database", `TypeError: Cannot read properties of undefined (reading 'id')` in `menu-item-testing.util.ts:284`) both failed during the broad regression run. Verified via `git stash && npx jest ...` against the clean `multiTenant` branch (commit `eded24c`, no task-09 changes) — both failed identically, then `git stash pop` restored the working tree. Confirmed as baseline breakage unrelated to this task, no action taken.
- **Scratchpad script path resolution** — the first attempt at a DB-cleanup script was written to the session scratchpad (`/tmp/claude-0/.../scratchpad/cleanup.ts`) and run with `ts-node`; it failed with `TSError: ⨯ ... Cannot find module '@nestjs/core'` and several `Cannot find module '../../../workspaces/...'` errors because `ts-node`'s module resolution didn't reach outside the project root via relative paths. Not tagged as its own friction category — resolved immediately by rewriting the script inside `src/scripts/db/` (matching where `ts-node` project config expects it) and deleting it after use.
- No `is_error: true` tool results, no manual human corrections beyond the initial `/do-task multi-tenancy-support` invocation, and no tool-permission gaps found in the transcript.
