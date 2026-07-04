---
module: src/modules/users
last_reviewed: 2026-07-04
---

## Overview

Manages `app_users` — the accounts used to log into the app (distinct from any customer-facing concept). A `User` has a unique `name`, a hashed `password`, an optional `email`, and a many-to-many `roles` relationship to `Role` (`src/modules/roles`) that drives feature access via the global `RoleGuard`. `UserController` is gated with `@Roles(ROLE_ADMIN)` at the class level, so every route in this module requires an admin role — user management itself is an admin-only feature.

Follows the standard base-class stack: `UserService extends ServiceBase`, `UserValidator extends ValidatorBase`, `UserBuilder extends BuilderBase`, `UserController extends ControllerBase`, plus a `UserChangeDetector` for update diffing. `UserModule` imports `RoleModule` via `forwardRef` (roles ↔ users is a circular module dependency) and depends on `AppLoggingModule` / `RequestContextModule` like other domains.

## Enforced Patterns

- **Passwords are never stored or compared in plaintext.** `UserService.createEntity` and `updateEntity` both call `hashPassword` (from `src/modules/auth/utils/hash`) before persisting; `UserBuilder.password()` also hashes via `setPropByFn(hashPassword, ...)`. Any new code path that sets a password must hash it the same way rather than assigning the raw DTO value.
- **`name` and `email` are enforced unique** by `UserValidator.validateIdentity` via `helper.enforceUnique(...)`, scoped by the entity's own `id` so updates don't collide with themselves. There is no uniqueness check on `password`.
- **`roleIds` on create/update must reference existing roles.** `UserValidator` calls `helper.enforceExists` against the `Role` repo for every id in `identity.roleIds` before the entity is persisted.
- **`UpdateUserDto.roleIds` is required (`@IsNotEmpty`)**, unlike `CreateUserDto.roleIds` which is optional — a user can be created with zero roles but an update payload must always supply the full desired role set (roles are replaced wholesale, not merged) since `UserChangeDetector` and `updateEntity` both treat `dto.roleIds` as the complete target list.
- **Change detection compares roles by id, not by reference.** `UserChangeDetector.detect` sorts `existingRoleIds` vs `incomingRoleIds` and diffs with `sameNumberArray` — order in the DTO doesn't matter, only set membership. Password changes are always recorded as a change when `dto.password !== undefined` (no ability to diff hashed vs. plaintext), so any update that includes a password is treated as a real change even if it hashes to the same value.
- **`getUpdateDiffRelations()` returns `['roles']`**, telling `ServiceBase` to eager-load the `roles` relation before diffing — omitting this would make the change detector see `entity.roles` as `undefined` and always report a role change.
- **Password is stripped from responses by `ServiceBase` itself, not by anything user-specific.** `ServiceBase.create`/`update` set `result.password = undefined` whenever `'password' in result` (`src/common/base/service.base.ts`), a generic check rather than a users-only guard. `findAll`/`findOne` responses go through this same base and so are also affected — but any code calling `UserService`/`UserBuilder` internals directly (bypassing `ServiceBase`'s public methods) will still see the hashed password on the entity.

## Gotchas
