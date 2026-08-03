---
task: prd/multi-tenancy-support/tasks/10-settings-module.md
date: 2026-08-03
outcome: done
tags: [tool-gap, test-flakiness]
tools-used: [Bash, Read, Edit, Agent, TaskCreate, Write]
tools-requested-but-missing: []
modules-touched: [src/modules/settings, src/app.module.ts]
---

## What happened

Single pass, no manual human corrections beyond the initial `/do-task multi-tenancy-support` invocation. Confirmed 10 was the lowest-numbered eligible `todo` task (`blocked-by: 01`, already done), marked it `in-progress`, read the PRD source section and `OrderCategory` (cited as "simplest tenant-wide entity" template) plus the base classes (`tenant-scoped-service.base.ts`, `location-scoped-service.base.ts`).

Spawned a foreground research `Agent` ("Research settings module implementation seams") to pull `RoleGuard`/`@Roles`/`@LocationScope`/`@Public` semantics, validator/exception conventions, and an existing nullable-discriminator entity pattern (`dynamic-property-config.entity.ts`) before writing code — this fed directly into the design decision below.

Built the full module in one sweep: `entities/setting.entity.ts`, `utils/setting-key.registry.ts`, `utils/setting-value.util.ts`, DTOs (`create-setting.dto.ts`, `update-setting.dto.ts`, `effective-setting.dto.ts`), validator + identity interface, change detector, `settings.service.ts`, `settings.controller.ts`, `settings.module.ts`, `setting-test.util.ts`, `settings-testing.module.ts`, then wired into `src/app.module.ts`. Iterated to a clean `tsc --noEmit` (two rounds — see Friction), then wrote specs (change-detector, validator, service, controller — 36 tests), iterated to a clean `npx jest --runInBand src/modules/settings` (one round — see Friction), then ran the full `npm run test` (871 tests, 1 pre-existing unrelated failure), `npm run lint` (broken in this environment, unrelated to this task), and `npm run build` (clean).

## Deviations from plan

The task text explicitly flagged an open question: "Route-level admin/manager authorization... should use whatever `RoleGuard` semantics are available at implementation time; if slice `08` hasn't landed yet, wire basic auth for now." The research agent confirmed slice 08 (location-aware `RoleGuard`) had already landed, so no interim/basic-auth scaffolding was built — the controller uses the existing `@Roles`/`@LocationScope` decorators directly, and `SettingsService` extends `LocationScopedServiceBase` for defense-in-depth (tenant-default writes require `isTenantAdmin`; location-override writes require assignment there; update/remove re-verify against the *stored* `locationId`, not a client-supplied one). This is a resolution of an explicitly-anticipated fork in the task, not an undocumented deviation.

One implementation detail not spelled out in the task: `(tenantId, locationId, name)` uniqueness is enforced via **two partial unique indexes** (one scoped to `locationId IS NULL`, one to `IS NOT NULL`) rather than a single composite unique constraint, because Postgres treats NULLs as distinct under a plain composite unique index. Documented as a code comment on the entity per the session's own final-summary note, rather than promoted to base-class-level guidance.

## Friction points

- **`TaskCreate` misuse** (tag: `tool-gap`) — the session tried to seed a full task list in one call: `TaskCreate({"tasks": "[...]"})`. Result: `InputValidationError: ... An unexpected parameter 'tasks' was provided ... TaskCreate creates ONE task per call and has no 'tasks' or 'todos' parameter.` Not retried with individual calls — the session abandoned the tracker entirely ("I'll skip the formal task tracker and proceed directly with implementation") and went straight to `Write`. No functional impact, but the tool's actual interface (one task per call) doesn't match what a multi-step implementation plan naturally wants to hand it in one shot.
- **Two rounds of `tsc --noEmit` before clean** — first run (`Bash` idx 59) surfaced `FindOptionsWhere<Setting>` typing errors from passing `{ tenantId, locationId: null }` into a `where` clause (`Type 'null' is not assignable to type 'number | FindOperator<number> | undefined'`), at two call sites in `settings.service.ts`. Fixed via `IsNull()` from TypeORM across three `Edit` calls to the service; second run was clean.
- **One failing spec before green** — `npx jest --runInBand src/modules/settings` (idx 76) failed `setting validator › fail validate create: value type does not match the registry` (`expect(result).toBe(size)`, expected 1 validation error, got 2). Fixed with one `Edit` to the spec; rerun (idx 78) passed all 36 tests.
- **Pre-existing, unrelated test failure** (tag: `test-flakiness`) — full `npm run test` run showed `tenant.service.spec.ts › should find seeded tenant in findAll results` failing (`expect(found).toBeDefined()` → `undefined`). Verified unrelated by rerunning that spec in isolation (same failure) and confirming via `git diff --stat main -- src/modules/tenants` that the tenants module had zero changes in this session. No action taken, consistent with the same failure logged in debrief 09.
- **`npm run lint` / raw `eslint` both broken in this environment** — `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'typescript-eslint' imported from /workspaces/petsiWebApp/backend/eslint.config.mjs`. Pre-existing environment issue, not introduced by this task; not fixed (out of scope), just noted in the session's final summary.
- **Task file's `session:` placeholder needed manual resolution** — the frontmatter template value was the literal unexpanded string `session: $CLAUDE_CODE_SESSION_ID`; the session ran `echo "$CLAUDE_CODE_SESSION_ID"` via `Bash` to get the real value and then `Edit`ed it in. Self-resolved, no escalation, but indicates the task-file templating step that stamps `session:` doesn't reliably substitute the env var.
