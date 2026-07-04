---
module: src/modules/auth
last_reviewed: 2026-07-04
---

## Overview

`src/modules/auth` implements username/password login and JWT issuance for the whole application. It is a small module: `AuthController` exposes a single `POST /auth/login` endpoint, `AuthService` validates credentials and mints the token, `AuthGuard` is the global gatekeeper wired in `AppModule`, and `utils/hash.ts` wraps bcrypt for password hashing.

**Login flow** (`AuthController.signIn` → `AuthService.signIn`):
1. `AuthController.signIn` is decorated `@Post('login')` and `@Public()` (from `src/common/decorators/PublicLogin.ts`) so the global `AuthGuard` lets the request through without a token.
2. `AuthService.signIn(username, rawPass)` loads the `User` by `name` via `userRepo.findOne({ where: { name: username }, relations: ['roles'] })` — the `roles` relation is eagerly joined so the role names can go into the JWT payload.
3. The raw password is compared against the stored bcrypt hash with `isPassHashMatch` (`utils/hash.ts`). Any failure (unknown user or bad password) throws `UnauthorizedException('Invalid username or password')` — the message is intentionally identical in both cases so the endpoint doesn't leak whether a username exists.
4. On success it builds the JWT payload: `{ sub: user.id, username: user.name, roles: user.roles.map(r => r.name) }` and signs it with `this.jwtService.signAsync(payload, { expiresIn: '1hr' })`.
5. The response (`AuthResponseDto`) returns `{ access_token, roles }`. The `roles` array in the response is for frontend rendering only — the actual authorization decision is always made from the roles embedded in the verified JWT payload, never from this field.

**Token verification / guard**: `AuthGuard` is registered globally via `APP_GUARD` in `src/app.module.ts`. On every request it:
- Checks `IS_PUBLIC_KEY` metadata via `reflector.getAllAndOverride`; if true, returns `true` immediately, skipping verification entirely.
- Otherwise extracts the bearer token from the `Authorization` header, and if missing throws `UnauthorizedException`.
- Verifies the token with `jwtService.verifyAsync(token, { secret: this.authService.getJwtSecret() })` (secret pulled from `JWT_SECRET` env var). Any verification failure (expired, bad signature, malformed) is caught and rethrown as a bare `UnauthorizedException` (401), never a more specific error.
- On success it stores the decoded payload on the request as `request['user'] = payload` — the only place `request.user` gets populated.
- It also pushes `payload.sub` (as a numeric `userId`) into the async request-context namespace (`getRequestNamespace()` from `src/modules/request-context/RequestContextService.ts`) when a context is active.

**There are no refresh tokens.** `AuthModule`'s `JwtModule.registerAsync` sets a module-level default `signOptions: { expiresIn: '60s' }`, but `AuthService.signIn`'s explicit `signAsync(payload, { expiresIn: '1hr' })` call overrides that default per-call, so real access tokens are valid for 1 hour. There is no refresh-token endpoint, no token blacklist/revocation list, and no session storage.

**Password hashing**: `utils/hash.ts` uses `bcrypt` with `saltOrRounds = 10`. `hashPassword` is used by consumers (e.g. `UserService`) when creating/updating users — this module only verifies, via `isPassHashMatch`.

Key relationships:
- `src/modules/users` — `AuthModule` imports `UserModule` and injects the TypeORM `User` repository directly (`TypeOrmModule.forFeature([User])` in `auth.module.ts`) rather than going through `UserService`; `User` entity has a `@ManyToMany(() => Role) roles: Role[]` relation that `AuthService.signIn` loads and flattens into the JWT payload's `roles: string[]`.
- `src/modules/roles` — `Role` entity supplies the role `name` strings (`ROLE_ADMIN`/`ROLE_MANAGER`/`ROLE_STAFF` in `src/modules/roles/utils/constants.ts`) that end up in the token and are later checked by `RoleGuard` (`src/modules/roles/guards/role.guard.ts`).
- `@PublicLogin()`/`@Public()` (`src/common/decorators/PublicLogin.ts`) is `SetMetadata(IS_PUBLIC_KEY, true)`, `IS_PUBLIC_KEY = 'isPublic'`; consumed exclusively by `AuthGuard`. It has no effect on `RoleGuard`.
- `@Roles(...roles)` (`src/common/decorators/PublicRole.ts`) is `SetMetadata(ROLES_KEY, roles)`, `ROLES_KEY = 'roles'`; consumed exclusively by `RoleGuard`, a separate module, not by anything in `auth/`.
- `src/app.module.ts` registers three global guards via repeated `APP_GUARD` provider entries, in this exact order: `AuthGuard`, then `RoleGuard`, then `ThrottlerGuard`. NestJS runs multiple `APP_GUARD` providers in registration order, so `AuthGuard` always populates `request['user']` before `RoleGuard` reads it.

## Enforced Patterns

- **Password hashing is bcrypt, cost factor 10 — never store or compare plaintext.** Any new code that creates/updates a user's password must call `hashPassword` from `utils/hash.ts` before persisting, and any comparison must go through `isPassHashMatch`; this module deliberately does not export a "verify plaintext == plaintext" path.
- **Guards are global-only; you do not add `AuthGuard`/`RoleGuard` per-controller.** Because both are bound as `APP_GUARD` in `src/app.module.ts`, every controller in the app is protected by default. The only levers a controller author has are the two metadata decorators: `@Public()` to skip **JWT verification only**, and `@Roles(ROLE_X, ...)` to require the JWT payload's `roles` array contain at least one listed role name. If a route/class has no `@Roles(...)` at all, `RoleGuard.canActivate` returns `true` unconditionally — omitting `@Roles` means "any authenticated user," not "no access."
- **`@Public()` and `@Roles()` must never both apply to the same route.** `RoleGuard.canActivate` does `const { user } = context.switchToHttp().getRequest();` then `requiredRoles.some((role) => user.roles?.includes(role))`. If `AuthGuard` skipped verification because the route is `@Public()`, `request['user']` is never set, so `user` is `undefined` and `user.roles` throws a `TypeError` rather than a clean 401/403. Because `Reflector.getAllAndOverride` walks handler-then-class, a `@Public()` method inside a controller carrying a class-level `@Roles(...)` (as `UserController` does with `@Roles(ROLE_ADMIN)`) would break unless that method also has no role requirement in effect. `AuthController.signIn` is safe today only because its controller has no class-level `@Roles(...)`.
- **Guard ordering is load-bearing.** `RoleGuard` depends on `AuthGuard` having already run and attached `request['user'] = payload`; this only works because `AuthGuard` is registered before `RoleGuard` in the `providers` array of `src/app.module.ts`. Reordering those `APP_GUARD` entries would make role checks read `undefined` on every non-public request.
- **Invalid/expired/malformed tokens all collapse to a bare 401.** `AuthGuard.canActivate` wraps `jwtService.verifyAsync` in a try/catch and rethrows every failure mode as a generic `UnauthorizedException()`. Do not rely on distinguishing "expired" vs "invalid" from the HTTP response — the client only ever sees 401 with no body detail.
- **There is no refresh-token flow or server-side revocation.** Tokens are valid for the full 1-hour lifetime set by the explicit `expiresIn: '1hr'` argument to `signAsync` in `AuthService.signIn` (this overrides the module-level `JwtModule.registerAsync` default of `60s` — don't assume that `60s` value is the real token lifetime). Changing a user's roles or password, or deleting the user, does not invalidate already-issued tokens.
- **Role names must match exactly** between what's stored on `Role.name` and what's passed to `@Roles(...)` — comparison in `RoleGuard` is a plain string `.includes()` against the JWT payload's `roles` array, so `@Roles('Admin')` would not match a token containing `roles: ['admin']`. Use the shared constants in `src/modules/roles/utils/constants.ts` rather than hardcoding role strings in new controllers.

## Gotchas
