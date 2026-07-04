---
module: src/modules/revision-history
last_reviewed: 2026-07-04
---

## Overview

This module provides a **generic revision-history table** (`RevisionHistory`, `entities/revision-history.entity.ts`) and service used by aggregate-root services in other domains (currently `OrderService`, `MenuItemService` — see `src/modules/revision-history/constants/revision-entity-type.ts`) to append/list/retrieve versioned JSONB snapshots + change logs. It does not know about `Order` or `MenuItem` directly; callers pass an `entityType`/`entityId`/`changeLog`/`payload` and this module only deals in that generic shape.

Three services divide responsibilities:

- **`RevisionHistoryService`** (`revision-history.service.ts`) — DB access and mapping to API DTOs. `appendRevision(manager, { entityType, entityId, changeLog, payload })` looks up the current max `revisionNumber` for that `(entityType, entityId)` pair, increments it, and saves a new row via the caller-supplied `EntityManager` (so it participates in the caller's transaction). `listRevisions`/`getRevisionOrThrow`/`getRevisionRow` read them back. This service does not decide retention.
- **`RevisionHistoryPrunerService`** (`services/revision-history-pruner.service.ts`) — nightly cron (`@Cron('0 3 * * *')`) that deletes old rows per policy. Exposed via `runOnce()` for tests/manual runs.
- **`RevisionHistoryRetentionPolicyService`** (`services/revision-history-retention-policy.service.ts`) — reads global env-var defaults plus optional per-entity-type overrides and returns an effective `RevisionHistoryRetentionPolicy`.

`change-log-builder.ts` maps `ChangeDetectorBase` output (`ChangeDetectorChange[]`, from `src/common/base/change-detector.base.ts` — see `src/common/base/CLAUDE.md`) into the persisted, versioned `changeLog` JSON shape (`buildCreatedChangeLog`, `buildUpdatedChangeLog`, `buildRevertedChangeLog`, `persistedChangeLogToDto`). `revision-actor.util.ts`'s `getRevisionActor` derives the `ActorDto` (`{ type: 'user', id }` or `{ type: 'system' }`) from `RequestContextService`.

## Enforced Patterns

- **`RevisionHistoryService` is mocked by default in every domain's `*-testing.module.ts`** (per the root `CLAUDE.md` testing conventions) — pass `mockRevisionHistory: false` to exercise the real table in a spec.
- **`ChangeDetectorBase.detect(entity, dto)` returns `{ patch, hasChanges, changes[] }`**, where each `ChangeDetectorChange` has `op: 'scalar' | 'reference' | 'aggregate'`. `detectorChangesToPersistedChanges` (`change-log-builder.ts`) maps these to the persisted shape: `aggregate` ops get an `{ added, removed, modified }` summary computed by diffing id arrays or nested-DTO arrays (`computeAggregateSummary`), `reference` ops (or any path ending in `Id`) get `{ from, to }`, everything else is `scalar` with `{ from, to }` and `Date` values serialized to ISO strings.
- **`changeLog` rows are versioned (`CHANGE_LOG_SCHEMA_VERSION`) and validated at read time** — `persistedChangeLogToDto` throws rather than trusting old/foreign-shaped JSONB blindly (missing `schemaVersion`/`kind`/`occurredAt`, or an unrecognized `changes[].op`, is a hard error, not a best-effort parse). Changing the persisted change-log shape requires bumping `CHANGE_LOG_SCHEMA_VERSION` and updating `persistedChangeLogToDto` together.
- **To add a new tracked entity type**, add it to `REVISION_ENTITY_TYPES` in `constants/revision-entity-type.ts` and call `RevisionHistoryService.appendRevision` inside the domain service's `afterCreateInTransaction`/`afterUpdateInTransaction` hooks (see `src/common/base/CLAUDE.md`) — there is no other registration point, and `RevisionHistoryPrunerService.runOnce` iterates `REVISION_ENTITY_TYPES_ARRAY` directly so a newly added type is automatically included in pruning.
- **Pruning is off by the write path entirely** — `appendRevision` never deletes anything; deletion only happens via `RevisionHistoryPrunerService`'s nightly cron (or manual `runOnce()`), and only when enabled.
- **Revision 1 is always retained and never counts toward the per-entity revision cap.** A row is eligible for deletion only when it is *both* older than `minAgeDays` *and* outside the newest `maxRevisionsExcludingCreate` window (computed ignoring revision 1) — `pruneEntityType` computes `keepFrom = max(2, headRev - maxRevisionsExcludingCreate + 1)` and only deletes rows with `revisionNumber < keepFrom` and `createdAt < cutoff`.
- **Pruning config, global env vars (with defaults):**
  - `REVISION_HISTORY_PRUNE_ENABLED` (default `false`) — enables the cron job.
  - `REVISION_HISTORY_PRUNE_DRY_RUN` (default `true`) — when `true`, nothing is deleted; the job only logs what it would delete.
  - `REVISION_HISTORY_PRUNE_BATCH_LIMIT` (default `5000`) — max rows deleted per run.
  - `REVISION_HISTORY_MAX_REVISIONS` (default `10`) — max revisions kept per entity instance, excluding revision 1.
  - `REVISION_HISTORY_MIN_AGE_DAYS` (default `30`) — minimum age in days before a revision can be deleted.
  - Per-entity overrides: `REVISION_HISTORY_<ENTITY>_MAX_REVISIONS` / `REVISION_HISTORY_<ENTITY>_MIN_AGE_DAYS`, where `<ENTITY>` is the uppercased `entityType` (e.g. `ORDER`, `MENU_ITEM`).
  - Rollout suggestion: deploy with `PRUNE_ENABLED=true` and `PRUNE_DRY_RUN=true`, observe logs for a few runs, then flip `PRUNE_DRY_RUN=false`.

## Gotchas
