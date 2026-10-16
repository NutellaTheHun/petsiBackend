---
module: src/modules/locations
last_reviewed: 2026-08-02
---

## Overview

Two entities: `Location` (a physical site belonging to a `Tenant`) and `UserLocation` (assigns a `User` to a `Location` with a set of `Role`s held specifically at that location — a user's roles at one location are independent of their roles at another). A tenant-wide admin (`User.isTenantAdmin`) has access to every location without needing a `UserLocation` row.

`Location` is tenant-wide catalog data: `LocationService` extends `TenantScopedServiceBase`, so `findAll` only returns the caller's tenant and `findOne`/`remove` 404 on another tenant's id. `Location` keeps its `tenant` relation but also exposes the FK as a scalar `tenantId` column (`@JoinColumn({ name: 'tenantId' })`), which the base class reads. `tenantId` is not on the create/update DTOs — `createEntity` stamps it from `this.getTenantId()` and a location can never move tenants. `LocationValidator` currently has no rules.

`UserLocation` is operational data: `UserLocationService` extends `LocationScopedServiceBase` (which itself extends `TenantScopedServiceBase`), so both tenant scoping and per-location authorization apply automatically. `tenantId` and `locationId` are denormalized scalar columns on the entity (not relations) specifically so `ServiceBase`-level scoping never needs a join.

## Enforced Patterns

- **Location authorization is split by layer** (`src/common/base/location-scoped-service.base.ts`, used by `UserLocationService`): acting on an *existing* entity at a location the caller isn't assigned to behaves like the entity doesn't exist (`NotFoundException` from the service, mirroring the tenant-mismatch case). Targeting a `locationId` the caller chose on create is a 403 from `RoleGuard` via `@LocationScope('body', 'locationId')` on the route — the service no longer checks it. Moving an existing row to another location is rejected by the validator with `IMMUTABLE_FIELD`. Do not swap the 404 and 403 cases when extending this.
- **A `UserLocationService` subclass only needs to stamp `tenantId`/`locationId`** in `createEntity` (via `this.getTenantId()` / `dto.locationId`) and extend `LocationScopedServiceBase<X>` — no constructor changes, no manual scoping calls in domain code. Do not override `create`/`update`/`findAll`/`findOne`/`remove` in the domain service itself; scoping lives in the base class.
- **Cache scope must fold in location authorization, not just tenant.** `LocationScopedServiceBase.getCacheScope()` appends `|admin` or `|locations:<sorted ids>` on top of the tenant scope, because two callers in the same tenant with different location assignments must not be served each other's cached `findAll` results. `getCacheInvalidationScope()` deliberately drops the location component so a write at one location invalidates the `findAll` cache for every location-view variant in the tenant.
- **Never trust a client-supplied `tenantId`/`locationId` for scoping decisions.** `UserLocationService.createEntity` stamps `tenantId: this.getTenantId()` from `RequestContextService`, not from the DTO. The create route's `@LocationScope` makes `RoleGuard` check the body's `locationId` against the caller's JWT `locations` claim before the service runs.
- **Change detectors compare relation IDs, not objects.** `UserLocationChangeDetector` sorts both the existing `entity.roles` ids and incoming `dto.roleIds` before comparing (order-independent `sameNumberArray`), and `UserLocationService` declares `['roles']` in `getUpdateDiffRelations()` so the base update flow loads it before diffing. `LocationChangeDetector` only diffs scalar fields.
- **`UserLocationValidator` validates identity, not business rules** — it calls `enforceExists` against `userRepo`/`roleRepo` for every id present in the resolved identity (looping over `roleIds` individually), and nothing else. `LocationValidator` has no rules. There is no uniqueness or cross-field validation for either entity.

## Gotchas
