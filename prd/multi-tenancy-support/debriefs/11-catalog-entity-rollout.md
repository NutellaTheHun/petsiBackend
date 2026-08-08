---
task: prd/multi-tenancy-support/tasks/11-catalog-entity-rollout.md
date: 2026-08-07
outcome: done-with-deviations
tags: [session-limit, wrong-assumption, missing-context]
tools-used: [Bash, Read, Edit, ToolSearch, TaskCreate, TaskUpdate, Agent, ScheduleWakeup]
tools-requested-but-missing: []
modules-touched: [src/modules/dynamic-properties, src/modules/inventory-areas, src/modules/labels, src/modules/menu-items, src/modules/recipes, src/modules/reports, src/modules/seed, src/modules/templates, src/modules/tenants]
---

## What happened

Task 11 (roll `TenantScopedServiceBase` out to the 19 remaining catalog entities across 7 modules) was picked automatically — tasks 01-10 were `done`, and 11/12/13 were all eligible (`blocked-by: 04`, done); 11 was lowest-numbered.

The session split the work into 4 parallel background `Agent` groups (menu-items; recipes; inventory-items; labels+templates+dynamic-properties+reports), each given the `OrderCategory`/slice-04 reference files and detailed per-entity instructions (unique-constraint disposition, composer-stamping notes gathered up front by reading each module's entities/composers directly). Group C (inventory-items) finished cleanly in the background — 103 tests passing.

The other 3 groups (A/B/D) all failed mid-run with **"You've hit your session limit · resets 5:40am (UTC)"** (human msgs 5-7) before finishing. The session picked back up via a second `/do-task` invocation after the reset, with `git status`/`git diff` used to discover how far each interrupted group had actually gotten (substantial progress existed in every one — entities/services/validators/composers/testing-utils were done; only controller-spec fixups and Group D's templates/dynamic-properties/reports modules were still unstarted).

The rest of the session finished the remaining work directly (no more subagents): fixed ~15 controller specs across menu-items/recipes/labels to seed a tenant and call `requestContext.setContext`; built templates, dynamic-properties, and reports from scratch following the same pattern; then ran a full-suite pass and fixed fallout in modules task 11 doesn't own (`inventory-areas`, `seed`, `tenants` — see Deviations).

`TaskCreate`/`TaskUpdate` were used to track the 4 parallel groups plus a final-verification task, which made resuming after the session-limit interruption straightforward (task list showed exactly which groups were still `in_progress`).

## Deviations from plan

- **`ReportDefinitionService` doesn't extend `ServiceBase`** at all (bespoke CRUD, no validator/builder) — the task file's instruction ("change the service to extend `TenantScopedServiceBase` instead of `ServiceBase`") assumed uniform architecture across all 19 entities, which didn't hold for this one. Resolved by hand-rolling the equivalent contract (private `getTenantId()`, stamp-on-create, tenant-filtered `findAll`/`findOne`) rather than forcing it into the base-class hierarchy — documented explicitly as an accepted exception in the task file's acceptance criteria.
- **Nested/composed entities needed composer-level stamping, not just service-level.** `MenuItemContainerItem`, `TemplateMenuItem`, `RecipeSubCategory`, `RecipeIngredient`, `InventoryItemSize` are all created two ways (own service + nested via a parent's `ComposerBase` subclass). The task file didn't call this out; each composer needed `RequestContextService` injected by hand since `ComposerBase` doesn't provide it.
- **`ReportExecutionService.execute`'s direct `ReportDefinition` lookup** was a real cross-tenant read the task file didn't mention — fixed alongside `ReportDefinitionService` since it was the same root cause.
- **Fixed regressions in modules task 11 doesn't own**, surfaced only once entities in their dependency chain became tenant-scoped: `inventory-areas` controller/service specs (nested `InventoryItemSize` creation via composer needed a tenant context), `tenant.service.spec.ts` (unbounded `findAll()` assumption broke once many fixture tenants existed), and a pre-existing `MenuItem` row leak in `menu-item.service.spec.ts`'s revision-history block that broke `SeedService`'s global item query once orphaned. None of these were in task 11's "What to build," but leaving them broken would have left `npm run test` red.

## Friction points

- **Session-limit interruption killed 3 of 4 background groups mid-run** (tag: `session-limit`). Evidence: `<task-notification>` failures for tasks `a199052134be3b4be`, `a1ff15e95c756ea44`, `ad001ad5a5d0e1dc1`, each `"Agent ... failed: Agent terminated early due to an API error: You've hit your session limit · resets 5:40am (UTC)"`. Cost real time: the session had to re-derive state via `git status`/`git diff` after the reset rather than trusting the groups' own completion reports. Worth flagging for future large-fan-out tasks: 4 heavy DB-touching background agents launched simultaneously is enough to burn through a session's budget before they can report back cleanly.
- **`synchronize: true` schema sync fails outright once a `NOT NULL` column is added onto a table with existing rows** (tag: `wrong-assumption`) — `QueryFailedError: column "tenantId" ... contains null values`, discovered repeatedly (evidence: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` run 7 separate times across the session, once per debugging cycle). The PRD does say the dev/test DB "is reseeded under the new model rather than migrated in place," but the task file itself never mentions needing to wipe the schema mid-session — an agent hitting this for the first time burns real debugging time (one interrupted group's last assistant text before running out of budget was chasing this down as a suspected NestJS DI circular-dependency stack overflow, when the actual root cause was the schema-sync failure cascading into repeated connection retries).
- **Test-data collision in labels specs** (tag: `wrong-assumption`) — new tenant-scoping assertions in `label.service.spec.ts`/`label.controller.spec.ts` reused `singleItems[1]`/`labelTypes[1]` combos already consumed by `seedLabels`' modulo-cycling fixture generator, tripping the app-level "one `Label` per `(menuItem, labelType)` pair" uniqueness rule. Fixed by creating a dedicated fresh `LabelType` per test rather than reusing seeded indices.
- **`/debrief-task` can't be dispatched from a background `Agent`** (tag: `missing-context`) — `do-task`'s own final step says to "spawn a background Agent invoking `/debrief-task ...`," but the skill has `disable-model-invocation: true` and refuses when triggered that way, so the debrief only actually ran once the user invoked `/debrief-task` directly as a slash command in a later turn. `do-task`'s instructions describe a handoff that doesn't work as written.
- Minor: `python3` isn't available in this environment (a `sed`-via-Python regex substitution attempt failed with `command not found`); recovered immediately by falling back to direct `Edit` calls. Not worth a tag — no retries or wasted cycles beyond the one failed attempt.
