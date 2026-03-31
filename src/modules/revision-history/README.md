# Revision history

This module provides a **generic revision history** table and service that can be used by aggregate-root services (e.g. `OrderService`, `MenuItemService`) to:

- **append** a revision row after create/update/revert
- **list** revisions for an entity instance (metadata + change log, no payload)
- **get** a single revision (includes snapshot payload)

The revision payload is stored as a JSONB snapshot of the aggregate at that time.

## Responsibilities

- **`RevisionHistoryService`** (`revision-history.service.ts`)\n  DB access and mapping to API DTOs (append/list/get). It does not decide retention.

- **`RevisionHistoryPrunerService`** (`services/revision-history-pruner.service.ts`)\n  Nightly cron job that enforces retention by deleting old rows according to policy.

- **`RevisionHistoryRetentionPolicyService`** (`services/revision-history-retention-policy.service.ts`)\n  Reads global defaults + optional per-entity overrides from configuration/env.

## Retention / pruning

Pruning runs via cron (nightly, off-peak) and is **not part of the write path**.

### Invariants

- **Revision 1 is always retained** and **does not count** toward the per-entity cap.
- A revision is eligible for deletion only when it is **both**:\n  - older than `minAgeDays`, and\n  - outside the newest `maxRevisionsExcludingCreate` window (computed ignoring revision 1)

### Configuration

Global keys (defaults shown):

- `REVISION_HISTORY_PRUNE_ENABLED` (default `false`)\n  Enables the cron job.\n- `REVISION_HISTORY_PRUNE_DRY_RUN` (default `true`)\n  When `true`, nothing is deleted; the job logs what it *would* delete.\n- `REVISION_HISTORY_PRUNE_BATCH_LIMIT` (default `5000`)\n  Maximum rows deleted per run.\n- `REVISION_HISTORY_MAX_REVISIONS` (default `10`)\n  Max revisions kept per entity instance, excluding revision 1.\n- `REVISION_HISTORY_MIN_AGE_DAYS` (default `30`)\n  Minimum age in days required before a revision can be deleted.

Optional per-entity overrides (where `<ENTITY>` is the uppercased `entityType`, e.g. `ORDER`, `MENU_ITEM`):

- `REVISION_HISTORY_<ENTITY>_MAX_REVISIONS`
- `REVISION_HISTORY_<ENTITY>_MIN_AGE_DAYS`

### Rollout suggestion

1. Deploy with `REVISION_HISTORY_PRUNE_ENABLED=true` and `REVISION_HISTORY_PRUNE_DRY_RUN=true`.\n2. Observe logs for a few runs.\n3. Flip `REVISION_HISTORY_PRUNE_DRY_RUN=false` once confirmed.

