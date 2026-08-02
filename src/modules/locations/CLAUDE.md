---
module: src/modules/locations
last_reviewed: 2026-08-02
---

## Overview

Two entities: `Location` (a physical site belonging to a `Tenant`) and `UserLocation` (assigns a `User` to a `Location` with a set of `Role`s held specifically at that location — a user's roles at one location are independent of their roles at another). A tenant-wide admin (`User.isTenantAdmin`) has access to every location without needing a `UserLocation` row.

`Location` is treated as tenant-wide catalog data: `LocationService` extends plain `ServiceBase`, not `TenantScopedServiceBase` — there is no automatic tenant filter on `findAll`/`findOne`. Callers filter by tenant explicitly via `filters=tenant=<id>` (`LocationService.applyFilters`); `LocationController` exposes this in its `findAll` query docs. `LocationValidator` only checks that `tenantId` refers to an existing `Tenant` — it enforces no per-tenant name-uniqueness rule.

`UserLocation` is operational data: `UserLocationService` extends `LocationScopedServiceBase` (which itself extends `TenantScopedServiceBase`), so both tenant scoping and per-location authorization apply automatically. `tenantId` and `locationId` are denormalized scalar columns on the entity (not relations) specifically so `ServiceBase`-level scoping never needs a join.

## Enforced Patterns

- **`LocationScopedServiceBase` two-failure-mode rule** (`src/common/base/location-scoped-service.base.ts`, used by `UserLocationService`): acting on an *existing* entity at a location the caller isn't assigned to behaves like the entity doesn't exist (`NotFoundException`, mirrors the tenant-mismatch case). Explicitly targeting a `locationId` the caller chose (create, or moving an entity via update) instead throws `ForbiddenException` — Location itself is tenant-wide-readable so there's no ambiguity about whether it exists, just whether the caller may act there. Do not swap these two failure modes when extending this behavior.
- **A `UserLocationService` subclass only needs to stamp `tenantId`/`locationId`** in `createEntity` (via `this.getTenantId()` / `dto.locationId`) and extend `LocationScopedServiceBase<X>` — no constructor changes, no manual scoping calls in domain code. Do not override `create`/`update`/`findAll`/`findOne`/`remove` in the domain service itself; scoping lives in the base class.
- **Cache scope must fold in location authorization, not just tenant.** `LocationScopedServiceBase.getCacheScope()` appends `|admin` or `|locations:<sorted ids>` on top of the tenant scope, because two callers in the same tenant with different location assignments must not be served each other's cached `findAll` results. `getCacheInvalidationScope()` deliberately drops the location component so a write at one location invalidates the `findAll` cache for every location-view variant in the tenant.
- **Never trust a client-supplied `tenantId`/`locationId` for scoping decisions.** `UserLocationService.createEntity` stamps `tenantId: this.getTenantId()` from `RequestContextService`, not from the DTO; `assertLocationAuthorized` similarly reads authorized locations from `RequestContextService`, never from the request body, before allowing a create/update against a given `locationId`.
- **Change detectors compare relation IDs, not objects.** `LocationChangeDetector` diffs `entity.tenant?.id` against `dto.tenantId`; `UserLocationChangeDetector` sorts both the existing `entity.roles` ids and incoming `dto.roleIds` before comparing (order-independent `sameNumberArray`) — both services declare the corresponding relation in `getUpdateDiffRelations()` (`['tenant']` / `['roles']`) so the base update flow loads it before diffing.
- **`LocationValidator`/`UserLocationValidator` validate identity, not business rules** — they call `enforceExists` against `tenantRepo`/`userRepo`/`roleRepo` for every id present in the resolved identity (looping over `roleIds` individually for `UserLocation`), and nothing else. There is no uniqueness or cross-field validation layered on for either entity.

## Gotchas
