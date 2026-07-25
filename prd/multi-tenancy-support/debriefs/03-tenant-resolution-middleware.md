---
task: prd/multi-tenancy-support/tasks/03-tenant-resolution-middleware.md
date: 2026-07-25
outcome: done
tags: [clean, test-flakiness]
tools-used: [Bash, Read, Edit, Write, Agent]
tools-requested-but-missing: []
modules-touched: [src/common/middleware, src/modules/tenants, src]
---

## What happened

Task selected via `/do-task multi-tenancy-support` in a fresh session (post `/clear`); the session picked up task `03` since `01` and `02` were already `done`. Task file status flipped to `in-progress` immediately (`Edit` on `tasks/03-tenant-resolution-middleware.md`).

Investigation phase (all `Read`/`Bash`): re-read the PRD's "Tenant resolution / routing" and "Testing Decisions" sections, then surveyed the existing seam this slice mirrors — `RequestIdMiddleware.ts` and `app.module.ts`'s `configure()` — plus `RequestContextService`, the `Tenant` entity/service/validator from slice `01`, `AuthGuard`, `AppHttpException`/`error_constants.ts`, and `tenants.module.ts`/`revision-history.module.ts` (to confirm how a module exports its `TypeOrmModule` repository for cross-module injection). Also grepped the codebase for any pre-existing subdomain/host-header handling (none found) and for existing middleware specs (none found — this is a genuinely new test seam, as the PRD's Testing Decisions anticipated) and briefly inspected `@nestjs/core`'s middleware module internals to confirm thrown exceptions from a middleware's `use()` propagate correctly through Nest's exception filter rather than needing manual `next(err)` handling.

Implementation:
- `src/common/middleware/TenantResolutionMiddleware.ts` (new) — `NestMiddleware` that extracts the subdomain from `req.headers['host']` (splits off the port, takes the first dot-segment; returns `undefined` for a bare host like `localhost` with no dot), looks up `Tenant` by `subdomain` via an injected repository, attaches the resolved entity to `req['tenant']`, and calls `next()`. On a missing/unparseable host or an unmatched subdomain, throws `AppHttpException` (404, `ENTITY_NOT_FOUND`) rather than falling through to `next()` — non-auth-shaped, per the acceptance criteria.
- `src/modules/tenants/tenants.module.ts` — added `TypeOrmModule` to `exports` so `TenantResolutionMiddleware` (registered at the `AppModule` level, outside the tenants module) can inject the `Tenant` repository.
- `src/app.module.ts` — imported `TenantResolutionMiddleware` and added it to the existing `consumer.apply(RequestIdMiddleware, ...)` chain in `configure()`, so both run for every route ahead of the guard chain; no reordering of `AuthGuard`/`RoleGuard`/`ThrottlerGuard` needed since Nest middleware always precedes `APP_GUARD` guards.
- `src/common/middleware/TenantResolutionMiddleware.spec.ts` (new) — direct middleware unit test (per the PRD's Testing Decisions), built with a plain object `req`/`res`/`next()` mock rather than a full Nest bootstrap, but using the real `getTenantsTestingModule()` + `TenantTestUtil.seedTenant(P)` for the DB-backed repository, following the file's own atomic-test-with-unique-prefix convention. Four cases: known subdomain resolves and calls `next`; unknown subdomain rejects before `next`; host with no subdomain (`localhost`) rejects; missing host header rejects.

Verification, in order: `npm run build` (clean), targeted spec run (`TenantResolutionMiddleware.spec.ts`, 4/4 passed), `npx jest --runInBand src/modules/tenants` (regression check on the module whose exports changed), `npm run lint` (see friction below), then a full `timeout 590 npx jest --runInBand` (133 suites, 768 tests: 1 suite / 1 test failed — `seed.service.spec.ts`, investigated and confirmed pre-existing/unrelated, see friction). Task file finalized: all five acceptance criteria checked, status → `done`. A background debrief `Agent` was then spawned for this task (the call whose prompt is `/debrief-task multi-tenancy-support 03-tenant-resolution-middleware` — this debrief is that agent's output).

## Deviations from plan

None of substance. The task explicitly said "do not push into `RequestContextService` yet" and "keep this slice self-contained to the middleware + a minimal request-level attachment" — honored via `req['tenant'] = tenant`, mirroring the `AuthGuard`-reads-`payload`-off-`req` pattern the task cited as the model to follow. No changes were made to `AuthGuard`, `RoleGuard`, or JWT payload shape, matching the task's explicit exclusion. The one addition not spelled out verbatim in "What to build" — exporting `TypeOrmModule` from `tenants.module.ts` — is a necessary consequence of the task's own instruction to look up `Tenant` from the middleware, not a scope expansion.

## Friction points

- **`test-flakiness`** — the full-suite run (`timeout 590 npx jest --runInBand`) showed `src/modules/seed/seed.service.spec.ts` failing (`TypeError: Cannot read properties of undefined (reading 'id')` at `menu-item-testing.util.ts:284`, inside container-size seeding — unrelated to tenant/middleware code). Verified as pre-existing rather than caused by this change: `git stash && npx jest --runInBand modules/seed/seed.service.spec.ts` (i.e. rerun against the clean base commit) reproduced the identical failure, then `git stash pop` restored the working changes. Concluded the failure predates this slice and proceeded without further remediation.
- **Broken lint tooling, also pre-existing** — `npm run lint` failed outright with `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'typescript-eslint' imported from eslint.config.mjs`, before reaching any file. Same `git stash` / `git stash pop` check confirmed this reproduces identically on the clean base commit — a broken dependency in the environment, not something introduced by this task's changes. No tag from the fixed vocabulary fits a tooling-config break precisely (closest is `test-flakiness`, used loosely above to bucket both pre-existing-and-unrelated findings); flagging here in case `review-debrief` wants to add a dedicated tag for infra/tooling breakage.
- No genuine human interjections mid-session — the only `user`-role string messages were `/clear`/`do-task` slash-command boilerplate, no manual corrections.
- No tool errors (permission-denied or otherwise) occurred in this session.
