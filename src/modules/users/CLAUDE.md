---
module: src/modules/users
last_reviewed: 2026-08-02
---

## Overview

Manages `app_users` — the accounts used to log into the app (distinct from any customer-facing concept). A `User` belongs to exactly one `Tenant` (`tenantId`, denormalized scalar column, `src/modules/tenants`) and has a unique `name` (unique per-tenant), a hashed `password`, an optional `email`, and an `isTenantAdmin` flag that grants access to every current and future location under the tenant without a per-location assignment. Users no longer carry a `roles` relation directly — per-location role grants live in `UserLocation` (`src/modules/locations`), which is a separate module from this one. `UserController` is gated with `@Roles(ROLE_ADMIN)` at the class level (from `src/modules/roles`), so every route in this module requires an admin role — user management itself is an admin-only feature; this is a route guard only, not a data relationship.

Follows the standard base-class stack: `UserService extends TenantScopedServiceBase` (not the plain `ServiceBase`), `UserValidator extends ValidatorBase`, `UserBuilder extends BuilderBase`, `UserController extends ControllerBase`, plus a `UserChangeDetector` for update diffing. `UserModule` imports `TenantsModule` and depends on `AppLoggingModule` / `RequestContextModule` like other domains.

## Enforced Patterns

- **Passwords are never stored or compared in plaintext.** `UserService.createEntity` and `updateEntity` both call `hashPassword` (from `src/modules/auth/utils/hash`) before persisting; `UserBuilder.password()` also hashes via `setPropByFn(hashPassword, ...)`. Any new code path that sets a password must hash it the same way rather than assigning the raw DTO value.
- **`tenantId` is stamped server-side, never trusted from the client.** `UserService.createEntity` sets `tenantId: this.getTenantId()` from `TenantScopedServiceBase`, which reads it out of `RequestContextService` — there is no `tenantId` field on `CreateUserDto`/`UpdateUserDto`.
- **`name` is enforced unique per-tenant; `email` is enforced unique globally.** `UserValidator.validateIdentity` calls `helper.enforceUnique` for `name` scoped with `{ tenantId: this.requestContextService.get('tenantId') }`, matching the entity's `@Unique(['tenantId', 'name'])` constraint — but the `email` uniqueness check has no tenant scope, so two different tenants cannot register the same email even though there's no DB-level constraint enforcing that. There is no uniqueness check on `password`.
- **Because `UserService` extends `TenantScopedServiceBase`, not `ServiceBase`,** `findOne`/`remove` are already tenant-scoped (a lookup for another tenant's id throws `NotFoundException` as if the row doesn't exist) and `findAll` is filtered via `applyScope`. Domain code here must not re-implement tenant filtering — `applySearch`/`applySortBy` only add to the query the base class already scoped.
- **`UpdateUserDto.name` is required (`@IsNotEmpty`, no `@IsOptional`)**, unlike `email`/`password`/`isTenantAdmin` which are all optional on update. A `PUT` payload must always include `name` even if unchanged.
- **Password changes are always recorded, never diffed.** `UserChangeDetector.detect` treats any update where `dto.password !== undefined` as a change (logging `'***'` for both previous/next value) since there's no way to compare a plaintext DTO value against an already-hashed stored value — even a resubmission of the same password short-circuits nothing.
- **`isTenantAdmin` changes are only detected when explicitly present in the DTO** — `UserChangeDetector` guards that field with `dto.isTenantAdmin !== undefined` before calling `unchanged()`, unlike `name`/`email` which are always diffed. There is no `getUpdateDiffRelations()` override in `UserService` — this module doesn't need to eager-load anything before diffing since it has no relations of its own.
- **Password is stripped from responses by `ServiceBase` itself, not by anything user-specific.** `ServiceBase.create`/`update` set `result.password = undefined` whenever `'password' in result` (`src/common/base/service.base.ts`), a generic check rather than a users-only guard. `findAll`/`findOne` responses go through this same base and so are also affected — but any code calling `UserService`/`UserBuilder` internals directly (bypassing `ServiceBase`'s public methods) will still see the hashed password on the entity.
- **Test fixtures need a valid `tenantId` to satisfy the NOT NULL column.** `UserTestUtil.seedUsers` lazily provisions (or reuses, by fixed subdomain) one shared fixture `Tenant` across the whole test run for fixtures that don't care about tenant scoping; tests that actually exercise tenant isolation seed and pass their own explicit `tenantId` instead of relying on the default.

## Gotchas
