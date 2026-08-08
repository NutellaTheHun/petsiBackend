---
task: prd/multi-tenancy-support/tasks/13-revision-history-tenant-scoping.md
date: 2026-08-08
outcome: done
tags: [clean, tool-gap]
tools-used: [Bash, Read, Edit, Agent]
tools-requested-but-missing: []
modules-touched: [src/modules/menu-items, src/modules/orders, src/modules/revision-history]
---

## What happened

Single unbroken session, no retries or errors. Sequence:

1. Selected task 13 (only eligible `todo` task; 12 others already `done`), flipped `status: in-progress` via `sed`.
2. Read the PRD's Further Notes (open question on `RevisionHistory` tenant scoping) and `src/modules/revision-history/CLAUDE.md`.
3. Investigated every call site of `RevisionHistoryService` (`grep -rn "listRevisions\|getRevisionOrThrow\|getRevisionRow\|appendRevision\|RevisionHistoryService"`), then read `menu-item.controller.ts`, `order.controller.ts`, `menu-item.service.ts`'s and `order.service.ts`'s `revertToRevision`, and `tenant-scoped-service.base.ts`/`location-scoped-service.base.ts` to confirm what `ServiceBase.findOne()` guarantees.
4. Found the leak: `MenuItemController.listMenuItemRevisions`/`getMenuItemRevision`, `OrderController.listOrderRevisions`/`getOrderRevision`, and `MenuItemService.revertToRevision` all queried `RevisionHistoryService` directly by raw `:id` with no owning-entity tenant/location check. `OrderService.revertToRevision` had a `this.findOne(orderId)` check but it ran *after* the unscoped revision-row read.
5. Decision taken: keep `RevisionHistory` schema-generic (no `tenantId`/`locationId` columns) — the "not needed" branch — provided every caller resolves the owning entity through its scoped `findOne()` first. Documented this as an enforced pattern in `src/modules/revision-history/CLAUDE.md`.
6. Fixed the 5 violating call sites (`Edit` on `menu-item.controller.ts` ×2, `order.controller.ts` ×2, `menu-item.service.ts`, `order.service.ts`) by adding/reordering the owning-entity-first `findOne()` call.
7. Extended `menu-item.revision-history.controller.spec.ts` and `order.revision-history.controller.spec.ts` with cross-tenant (both) and cross-location (order only) regression tests asserting `NotFoundException`.
8. Ran targeted suites (menu-items 110 tests, orders 169, revision-history 5) — all green — then a full repo run (925 tests) which surfaced 8 pre-existing failures in `settings.service.spec.ts` unrelated to this change. Verified via `git stash` + rerun against the unmodified base commit that the same 8 failures reproduce there too, confirming pre-existing pollution/bug, not a regression (`git stash` / `git stash pop` around `npx jest --runInBand src/modules/settings/services/settings.service.spec.ts`).
9. Ran `npm run clearTestDb` and reran the full suite once more for a clean confirmation — same 8 pre-existing failures, nothing else.
10. Marked task `status: done`, checked off acceptance criteria (noting the "add columns" criterion as N/A since the "not needed" branch was taken), recorded `session:`.
11. Attempted to spawn a background `Agent` to run `/debrief-task multi-tenancy-support 13-revision-history-tenant-scoping` per the `do-task` skill's final step — the spawned agent reported the `Skill` tool is restricted to explicit user invocation and cannot trigger `/debrief-task` on its own, so it asked the user to run the command directly instead.

## Deviations from plan

None from the task's "What to build" — both branches of the open question were explicitly allowed by the task file, and the "not needed" branch was chosen based on concrete evidence (the 5 unscoped call sites), not assumption.

The one deviation is process-level, not implementation-level: step 5 of the `do-task` skill ("spawn a background Agent invoking `/debrief-task ...`") did not work as designed — the spawned subagent could not invoke the `Skill` tool for `/debrief-task` and had to ask the user to run it manually, which the user then did.

## Friction points

- **`tool-gap`**: The `do-task` skill's final step instructs spawning a background `Agent` to invoke `/debrief-task <prd-slug> <task>`, but `Skill` invocation is restricted to direct user/slash-command use and isn't available to a spawned agent. The agent's own result: *"The `/debrief-task` skill is set up to be run directly as a slash command — it can't be triggered through my Skill tool (disabled for model invocation)... please run `/debrief-task multi-tenancy-support 13-revision-history-tenant-scoping` directly."* This means the automatic-debrief step of `do-task` is currently non-functional for every task, not specific to this one — worth fixing at the `do-task` skill level (e.g. spawn a `general-purpose`/`claude` agent that runs the debrief *logic* inline rather than trying to invoke the `/debrief-task` slash command from within an agent).
- No other friction: no tool errors, no ambiguous instructions requiring a stop-and-ask, no mid-session human corrections (the only human-authored strings in the transcript are the initial `/do-task multi-tenancy-support` invocation and later the `/debrief-task` invocation itself — both slash-command dispatches, not corrections).
