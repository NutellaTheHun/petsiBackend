---
module: src/modules/roles
last_reviewed: 2026-07-04
---

## Overview
Manages `Role` entities (e.g. `admin`, `manager`, `staff` — constants in `utils/constants.ts`) that gate access to endpoints across the app. `Role` has a `ManyToMany` relation to `User` (`src/modules/users`), which is why `RoleModule` imports `UserModule` via `forwardRef` (users and roles reference each other). Beyond the standard CRUD stack (entity, DTOs, builder, service, validator, controller, change detector), this module also owns `RoleGuard`, which is registered globally as an `APP_GUARD` in `AppModule` alongside the JWT `AuthGuard`. The `@Roles(...)` decorator (`src/common/decorators/PublicRole.ts`) attaches required-role metadata to a route/controller; `RoleGuard` reads that metadata via `Reflector` and checks it against `request.user.roles`, allowing the request through if no metadata is present.

## Enforced Patterns
- Role name uniqueness is enforced in `RoleValidator.validateIdentity` via `helper.enforceUnique`, not a DB unique constraint alone — `Role.name` also has `@Column({ unique: true })` as a second line of defense, but application-level validation is what produces the user-facing `ValidationErrorMap` error.
- `RoleChangeDetector` only diffs `name` — since `Role` has no other mutable scalar fields, this is the entire change surface; if a new mutable field is ever added to `Role`, it must be added here or updates to that field will silently no-op through `ServiceBase.update`'s short-circuit.
- `RoleController` is class-level `@Roles(ROLE_ADMIN)` — every route on this controller requires the `admin` role via `RoleGuard`, not just specific endpoints. There's no per-route role override in this controller; if a route here needs different access, use `@Roles(...)` on that method to override the class-level metadata (route-level metadata wins via `getAllAndOverride`).
- `RoleTestUtil` mixes two seeding strategies: `getTestRoleEntities`/`initRoleTestingDatabase` seed the three fixed real-world roles (`admin`/`manager`/`staff`) once per test run and are meant for specs that need actual role-gating behavior; `seedRoles(P)` creates prefixed throwaway roles (`role-a/b/c`) for atomic per-file CRUD tests per the repo-wide atomic-test pattern. Don't conflate the two — seeding a real role name a second time is guarded by an existence check in `initRoleTestingDatabase`, but `seedRoles` has no such guard and expects a unique `P`.

## Gotchas
