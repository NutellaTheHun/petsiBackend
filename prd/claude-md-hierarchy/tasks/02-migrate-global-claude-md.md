status: done
blocked-by: [01-init-local-skill-pilot-orders.md]

---

## Source

`prd/claude-md-hierarchy/plan.md`

## What to build

Create `src/common/base/CLAUDE.md` and `src/modules/revision-history/CLAUDE.md`, and trim the root `CLAUDE.md` down to pointers for the content that moves out of it.

**Prerequisite:** `01-init-local-skill-pilot-orders.md` must be complete. Use the `/init-local` skill built there to generate the initial Overview + Enforced Patterns draft for both new files, then hand-merge in the migrated detail below.

**Moves to `src/common/base/CLAUDE.md`:**
- The full base-class hierarchy diagram (`EntityBase` → `ServiceBase`/`ControllerBase`/`BuilderBase`/`ValidatorBase`/`ChangeDetectorBase`/`ComposerBase`, plus `NestedEntityBase`) — currently the "Base class system" section of the root CLAUDE.md.
- The `ServiceBase` lifecycle hook docs (`createEntity`, `updateEntity`, `afterCreateInTransaction`, `afterUpdateInTransaction`, `getChangeDetector`, `getUpdateDiffRelations`, `beforeRemove`/`afterRemove`).

**Moves to `src/modules/revision-history/CLAUDE.md`:**
- Revision-history internals: `ChangeDetectorBase.detect()` return shape (`patch`, `hasChanges`, `changes[]`), `RevisionHistoryService.appendRevision()`, the tracked-entity-types constants file, and how to add a new tracked entity type.
- The pruning-cron details (env vars, dry-run default) — currently part of the "Change detection + revision history" section.

**Root `CLAUDE.md` changes:**
- Replace the migrated sections with a one-line pointer to each new file (e.g. "Base class hierarchy and lifecycle hooks: see `src/common/base/CLAUDE.md`").
- Everything else in the root file stays as-is: Commands, directory layout, Testing (atomic-test pattern), Auth and roles, Caching, DB config — these are cross-cutting and do not move.
- Do not touch the "Change detection + revision history" section's cross-cutting parts (the fact that change detection exists and drives `updateEntity` patches) — only the revision-history-specific internals and pruning-cron detail move out.

## Acceptance criteria

- [x] `src/common/base/CLAUDE.md` exists, generated via `/init-local` then hand-merged with the full base-class hierarchy diagram and lifecycle-hook docs
- [x] `src/modules/revision-history/CLAUDE.md` exists, generated via `/init-local` then hand-merged with revision internals and pruning-cron details
- [x] Root `CLAUDE.md` no longer contains the migrated detail, replaced with a one-line pointer to each new file
- [x] Root `CLAUDE.md` still contains Commands, directory layout, Testing, Auth and roles, Caching, and DB config sections unchanged
- [x] No information is lost — every fact in the original "Base class system" and revision-history/pruning sections is present in one of the three files after migration
