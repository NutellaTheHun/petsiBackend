---
module: src/common/base
last_reviewed: 2026-08-07
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
- **`ControllerBase<TEntity>`** (`controller.base.ts`) — the default REST surface (`POST`/`GET`/`GET :id`/`PUT :id`/`DELETE :id`) wrapping a `ServiceBase`, with a 60s in-memory cache (cache hit/store/invalidate events logged at `debug` through an injected nestjs-pino `PinoLogger`, the controller's last constructor argument) (see Caching in the root `CLAUDE.md`).
- **`BuilderBase<T>`** (`builder.base.ts`) — queues async property-setting steps (`setPropById`, `setPropByName`, `setPropByFn`, `setPropByBuilder`, `setPropByVal`) onto a fresh entity instance, then drains the queue in `build()`. Used to translate a DTO's foreign-key-style fields (e.g. `categoryId`) into loaded entity references before persisting.
- **`ValidatorBase<T, I>`** (`validator.base.ts`) — resolves a DTO + id into an identity `I` (`{ id?, createId? }`, `ValidatorIdentityBaseInterface`), then validates that identity via the abstract `validateIdentity`. `NestedValidatorBase` (`nested-validator.base.ts`) extends this for validators invoked as children of a parent DTO's `validateNestedIdentity` call.
- **`ChangeDetectorBase<TEntity, TUpdateDto>`** (`change-detector.base.ts`) — see "Change detection" below.
- **`ComposerBase<T>`** (`composer.base.ts`) — creates/updates a `NestedEntityBase` entity within a transaction owned by the calling `ServiceBase` (or a parent composer). It never saves to the database itself — the owning service's transaction does that. `composeNestedEntity`/`composeManyNestedEntity` dispatch on whether the incoming nested DTO has a `createId` (create path, via `resolveCreateDto`) or an `id` (update path: only an entity in `existingEntities` / the `existing` argument — any other id throws).

## Enforced Patterns

- **Override lifecycle hooks on `ServiceBase`, never `create`/`update` themselves.** `create`/`update` are concrete and handle validation, transaction boundaries, and the DB-exception-to-HTTP-exception mapping; only `createEntity`/`updateEntity` are abstract. Subclasses also may override `afterCreateInTransaction`, `afterUpdateInTransaction`, `getChangeDetector`, `getUpdateDiffRelations`, `beforeRemove`, `afterRemove` — all no-ops by default. Overriding `create`/`update` directly bypasses the transaction wrapper and the DB-error conversion (`DatabaseError.fromTypeOrmError`).
  - `createEntity(dto, manager)` — **required**: build and persist the entity.
  - `updateEntity(dto, manager, entity)` — **required**: mutate the entity in place (the caller does `manager.save(entity)` afterward).
  - `afterCreateInTransaction(manager, entity)` — runs inside the create transaction (revision history is written here in domains that use it — see `src/modules/revision-history/CLAUDE.md`).
  - `afterUpdateInTransaction(manager, entity, ctx)` — runs inside the update transaction, after `manager.save`; `ctx.detectionResult` carries the change-detector diff (if a detector is wired up).
  - `getChangeDetector()` — return a `ChangeDetectorBase` to enable the no-op short-circuit (see below) and diff tracking.
  - `getUpdateDiffRelations()` — relations to eager-load on the pre-update entity before diffing (via `findOne(id, relations)` in `update`).
  - `beforeRemove(entity, manager)` / `afterRemove(entity, manager)` — hooks around `manager.remove` inside the remove transaction.
- **Base classes don't log, except `ControllerBase`'s debug cache events.** `ServiceBase`, `BuilderBase` and `ValidatorBase` take no logger; they throw and leave logging to `GlobalHttpExceptionFilter`. A new `ControllerBase` subclass must accept `PinoLogger` (from `nestjs-pino`) and pass it as the last `super(...)` argument.
- **`ServiceBase.update` short-circuits to a no-op when the change detector reports no changes** — if `getChangeDetector()` is defined and `detect(...).hasChanges` is `false`, `update` returns the existing entity without calling `updateEntity`, opening a transaction, or persisting anything. Any subclass wiring up a detector must expect `updateEntity` to not be called on a true no-op update (this is asserted directly in service specs per the root `CLAUDE.md` testing conventions).
- **`ComposerBase` subclasses must never call `manager.save`/`manager.remove` themselves for the entity they compose** — persistence is owned by the `ServiceBase` (or parent composer) that supplies the `EntityManager`; the composer's job is only to build/mutate the entity within that shared transaction and return it.
- **A nested `id` can only update one of the parent's current children.** The parent's validator calls `helper.enforceNestedOwnership(items, id, childRepo, '<parentRelation>', tenantId, '<field>', errorMap)` before its nested validation loop. It adds `REFERENCE_NOT_FOUND` for a missing row or one in another tenant, and `INVALID_REFERENCE` for a row under another parent or any `id` on create. As a safeguard, `composeManyNestedEntity` throws for an `id` not in `existingEntities`, and `composeNestedEntity` throws unless the `id` matches its `existing` argument. Callers must pass the loaded children (via `getUpdateDiffRelations`, a fresh `find` or an eager relation) on update and `[]` on create. A new parent with an upserted nested collection needs both.
- **A `ComposerBase` subclass that needs to stamp `tenantId` (or read any other request-scoped value) must inject `RequestContextService` itself** — `ComposerBase` has no constructor and doesn't provide it. This matters for any tenant-scoped entity that's also created as a nested child of a parent DTO (bypassing the owning service's `createEntity`/`TenantScopedServiceBase.getTenantId()`): the composer's own `createInTransaction` is the only place left to stamp `tenantId` on that path. See `MenuItemContainerItemComposer`, `TemplateMenuItemComposer`, `RecipeSubCategoryComposer`, `RecipeIngredientComposer`, `InventoryItemSizeComposer` for the pattern.
- **`BuilderBase` property setters (`setPropById`, `setPropByName`, `setPropByFn`, `setPropByBuilder`) queue work rather than run it immediately** — nothing on `this.entity` is actually populated until `build()`/`buildCreateDto()`/`buildUpdateDto()` drains `buildQueue`. Reading `this.entity[prop]` before calling `build()` will see the pre-queued state, not the resolved value.
- **`ValidatorBase.validateDto` always resolves an identity first, then validates it** — `resolveIdentity` is abstract per-domain (how to turn a raw create/update DTO into `{ id?, createId? }`), but `validateIdentity` is what subclasses actually implement business rules in. `validateNestedIdentity` is the entry point nested validators must use so failures get attached to the parent's `ValidationErrorMap` under the right field key, rather than thrown independently. `validate(dto, id)` returns the raw `ValidationErrorMap | null` (with log-only context); `ServiceBase` calls `validate`, not `validateDto`, and throws `new ValidationException(errorMap)`. Specs that bypass validation must spy on `validate`.
- **`LocationScopedServiceBase` scopes data; `RoleGuard` authorizes requests.** The base class makes rows at locations the caller isn't assigned to invisible (`findOne`/`update`/`remove` 404, `findAll` filtered) but does not 403 a client-chosen target `locationId` — that's `@LocationScope('body', 'locationId')` on the create route, enforced by `RoleGuard` (see `src/modules/roles/CLAUDE.md`). A location the guard can't see — a nested child stamped from an already-authorized parent (`OrderMenuItem`, `OrderContainerItem`, `RecurringOrderSchedule`), or one derived from a referenced entity (`InventoryAreaCount` via `inventoryAreaId`) — must be authorized inside `createEntity` with the inherited `assertLocationAuthorized`; omitting this silently skips authorization. See `InventoryAreaCountService.createEntity`/`updateEntity`. A location-scoped entity's `locationId` never changes after create: the domain validator rejects a different value with `IMMUTABLE_FIELD` (`helper.enforceUnchanged`), and `updateEntity` doesn't copy it.

## Gotchas
