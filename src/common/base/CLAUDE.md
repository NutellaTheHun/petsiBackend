---
module: src/common/base
last_reviewed: 2026-07-04
---

## Overview

This directory holds the abstract base-class hierarchy that every domain entity (orders, menu-items, recipes, etc.) participates in. It exists so that CRUD, pagination, caching, validation, change detection, and nested-entity composition are implemented once and shared, rather than re-implemented per domain module.

Every domain entity is rooted in a phantom-type carrier:

```
EntityBase<TEntity, CDto, UDto>   — phantom carrier; never instantiated
  └── ServiceBase<TEntity>        — CRUD + cursor pagination + lifecycle hooks
  └── ControllerBase<TEntity>     — REST endpoints + in-memory cache (60 s)
  └── BuilderBase<T>              — queue-based DTO→entity construction
  └── ValidatorBase<T, I>         — business rule validation (pre-DB)
  └── ChangeDetectorBase<T, UDto> — field-level diff on update
  └── ComposerBase<T>             — nested entity create/update within a transaction
```

`EntityBase` (`entity.base.ts`) declares `__Entity`/`__CDto`/`__UDto` as `declare`d (never assigned) phantom properties — it's purely a compile-time carrier so the other base classes can refer to `TEntity['__Entity']` etc. without a real instance existing. `NestedEntityBase` extends it with `__NcDto`/`__NuDto` phantom types for entities that can appear as nested children inside a parent DTO (paired with `NestedCreateDto`/`NestedUpdateDto` in `nested-create-dto.base.ts`/`nested-update-dto.base.ts`, and `NestedValidatorBase` in `nested-validator.base.ts`).

Each concrete base class in the hierarchy:

- **`ServiceBase<TEntity>`** (`service.base.ts`) — owns `create`/`update`/`findAll`/`findOne`/`remove` against `TEntity['__Entity']`, wraps create/update/remove in a transaction, runs the optional `ValidatorBase` before persisting, and runs the optional `ChangeDetectorBase` before `update`.
- **`ControllerBase<TEntity>`** (`controller.base.ts`) — the default REST surface (`POST`/`GET`/`GET :id`/`PUT :id`/`DELETE :id`) wrapping a `ServiceBase`, with request logging and a 60s in-memory cache (see Caching in the root `CLAUDE.md`).
- **`BuilderBase<T>`** (`builder.base.ts`) — queues async property-setting steps (`setPropById`, `setPropByName`, `setPropByFn`, `setPropByBuilder`, `setPropByVal`) onto a fresh entity instance, then drains the queue in `build()`. Used to translate a DTO's foreign-key-style fields (e.g. `categoryId`) into loaded entity references before persisting.
- **`ValidatorBase<T, I>`** (`validator.base.ts`) — resolves a DTO + id into an identity `I` (`{ id?, createId? }`, `ValidatorIdentityBaseInterface`), then validates that identity via the abstract `validateIdentity`. `NestedValidatorBase` (`nested-validator.base.ts`) extends this for validators invoked as children of a parent DTO's `validateNestedIdentity` call.
- **`ChangeDetectorBase<TEntity, TUpdateDto>`** (`change-detector.base.ts`) — see "Change detection" below.
- **`ComposerBase<T>`** (`composer.base.ts`) — creates/updates a `NestedEntityBase` entity within a transaction owned by the calling `ServiceBase` (or a parent composer). It never saves to the database itself — the owning service's transaction does that. `composeNestedEntity`/`composeManyNestedEntity` dispatch on whether the incoming nested DTO has a `createId` (create path, via `resolveCreateDto`) or an `id` (update path, looked up via `manager.findOneOrFail`).

## Enforced Patterns

- **Override lifecycle hooks on `ServiceBase`, never `create`/`update` themselves.** `create`/`update` are concrete and handle validation, transaction boundaries, and the DB-exception-to-HTTP-exception mapping; only `createEntity`/`updateEntity` are abstract. Subclasses also may override `afterCreateInTransaction`, `afterUpdateInTransaction`, `getChangeDetector`, `getUpdateDiffRelations`, `beforeRemove`, `afterRemove` — all no-ops by default. Overriding `create`/`update` directly bypasses the transaction wrapper and the DB exception handler.
  - `createEntity(dto, manager)` — **required**: build and persist the entity.
  - `updateEntity(dto, manager, entity)` — **required**: mutate the entity in place (the caller does `manager.save(entity)` afterward).
  - `afterCreateInTransaction(manager, entity)` — runs inside the create transaction (revision history is written here in domains that use it — see `src/modules/revision-history/CLAUDE.md`).
  - `afterUpdateInTransaction(manager, entity, ctx)` — runs inside the update transaction, after `manager.save`; `ctx.detectionResult` carries the change-detector diff (if a detector is wired up).
  - `getChangeDetector()` — return a `ChangeDetectorBase` to enable the no-op short-circuit (see below) and diff tracking.
  - `getUpdateDiffRelations()` — relations to eager-load on the pre-update entity before diffing (via `findOne(id, relations)` in `update`).
  - `beforeRemove(entity, manager)` / `afterRemove(entity, manager)` — hooks around `manager.remove` inside the remove transaction.
- **`ServiceBase.update` short-circuits to a no-op when the change detector reports no changes** — if `getChangeDetector()` is defined and `detect(...).hasChanges` is `false`, `update` returns the existing entity without calling `updateEntity`, opening a transaction, or persisting anything. Any subclass wiring up a detector must expect `updateEntity` to not be called on a true no-op update (this is asserted directly in service specs per the root `CLAUDE.md` testing conventions).
- **`ComposerBase` subclasses must never call `manager.save`/`manager.remove` themselves for the entity they compose** — persistence is owned by the `ServiceBase` (or parent composer) that supplies the `EntityManager`; the composer's job is only to build/mutate the entity within that shared transaction and return it.
- **`BuilderBase` property setters (`setPropById`, `setPropByName`, `setPropByFn`, `setPropByBuilder`) queue work rather than run it immediately** — nothing on `this.entity` is actually populated until `build()`/`buildCreateDto()`/`buildUpdateDto()` drains `buildQueue`. Reading `this.entity[prop]` before calling `build()` will see the pre-queued state, not the resolved value.
- **`ValidatorBase.validateDto` always resolves an identity first, then validates it** — `resolveIdentity` is abstract per-domain (how to turn a raw create/update DTO into `{ id?, createId? }`), but `validateIdentity` is what subclasses actually implement business rules in. `validateNestedIdentity` is the entry point nested validators must use so failures get attached to the parent's `ValidationErrorMap` under the right field key, rather than thrown independently.

## Gotchas
