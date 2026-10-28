---
module: src/modules/square
last_reviewed: 2026-10-28
---

## Overview

The one-way Square → Petsi integration. **Read the Square skill first** (`.claude/skills/square/SKILL.md`, and `sdk-reference.md` for exact `square@46` signatures): it holds the settled decisions, the link-table design, ingest rules and data-shape gotchas. This file only covers what the module's code itself enforces.

Current contents (foundation slice): the `SquareConnection` entity, the client factory, token encryption, the error boundary, and `GET /square/connection` (status). OAuth, syncs, ingest and webhooks are added by later slices of `prd/square-integration`.

## Enforced Patterns

- **Client factory is the only seam towards Square.** `SquareClientFactory` (`client/square-client.factory.ts`) is the only code that constructs a `SquareClient`. `forConnection(connection)` refuses unless `status === 'connected'` (`needs_reauth` → `SquareReauthRequiredException`, otherwise `SquareNotConnectedException`), decrypts the access token and returns a `SquareTenantApi`. `forApp()` returns a tokenless `SquareAppApi` for OAuth calls. Environment is Sandbox unless `NODE_ENV === 'production'`; the API version is pinned to `SQUARE_API_VERSION` (`utils/square-config.ts`).
- **`SquareTenantApi` / `SquareAppApi` (`client/square-api.ts`) list the allowed calls.** Reads only (plus `obtainToken`/`revokeToken`). They return plain `Promise`s, which `SquareClient` satisfies structurally. When a slice needs another read method, add it to the interface **and** to `unstubbedTenantApi()` in the fake. Never add a write.
- **Testing: `getSquareTestingModule()` always overrides the factory with `FakeSquareClientFactory`** (or `opts.squareClientFactoryClass`). The fake only replaces client construction (`createTenantClient`/`createAppClient`), so the status check and decryption still run. Specs assign typed `Square.*` fixtures to `fake.tenantApi.<resource>.<method>` / `fake.appApi.oAuth.<method>`, call `fake.reset()` in `beforeEach`, and can read `fake.tenantAccessTokens` (decrypted tokens the factory was asked to use). Unstubbed methods reject with "not stubbed". A domain module that calls Square must add this same override to its own testing module.
- **Tokens are encrypted at rest by `SquareTokenCryptoService`** (AES-256-GCM, stored as `v1:<iv>:<tag>:<ciphertext>`), keyed by `SQUARE_TOKEN_ENCRYPTION_KEY` (base64 of 32 bytes). The key is read on first use, so the app boots without it; any encrypt/decrypt then fails. The testing module loads a random key per module. Errors never contain the key, token or ciphertext.
- **`SquareConnection` is never returned from an endpoint.** It has no `@ApiProperty` and holds the encrypted tokens; map it to `SquareConnectionStatusDto`. Tokens never go in a response, DTO, log or revision snapshot.
- **`SquareConnectionService` is not a `ServiceBase`.** The connection is written by the OAuth flow and read on the webhook path (no request context), so methods that can run outside a request take `tenantId` explicitly; only `*ForCurrentTenant` methods read it from `RequestContextService`.
- **Error boundary (`client/square-error-boundary.ts`).** Wrap every Square call in `callSquare(() => api.x.y(...))`, or convert with `toSquareAppException(err)`. Square 401 → `SquareReauthRequiredException` (409 `SQUARE_REAUTH_REQUIRED`, deliberately not 401 so the frontend doesn't log the user out; catch this type to set `needs_reauth`); 404 → `SquareNotFoundException` (404 `SQUARE_NOT_FOUND`); timeouts and everything else → `SquareUpstreamException` (502, which the global filter turns into an opaque 500 and logs; its message carries only the status and Square error codes, never `detail` or `body`). Non-Square errors pass through. Nothing here logs. The client-visible codes are listed in `ERROR_RESPONSE_CODES`.
- **Access.** Every Square controller carries `@RequiresFeature(FEATURE_REGISTRY.SQUARE_INTEGRATION)`, except the webhook and OAuth callback. Tenant-admin-only routes use `@UseGuards(TenantAdminGuard)` (`isTenantAdmin === true`); `@Roles(ROLE_ADMIN)` is not enough, since it passes an admin of one location. Route guards run after the global ones, so a tenant without the flag gets the feature 403 first.

## Gotchas
