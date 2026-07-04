---
module: src/modules/app-logging
last_reviewed: 2026-07-04
---

## Overview

This module contains exactly two files: `app-logging.module.ts` and `app-logger.ts`. `AppLoggingModule` is a plain `@Module` (not `@Global()`) that provides and exports a single injectable, `AppLogger`, and is imported directly by `AppModule` as well as by nearly every domain module (`orders`, `auth`, `roles`, `labels`, `inventory-areas`, `inventory-items`, `menu-items`, `recipes`, `templates`, `dynamic-properties`, `users`, `seed-testing`), since each needs `AppLogger` injectable in its own DI scope.

`AppLogger` wraps the `Logger` class from `nestjs-pino` (injected via constructor) and exposes a narrow, structured API instead of letting callers use the raw pino logger directly:

- `logAction(context: string, requestId: string, action: string, status: 'REQUEST' | 'SUCCESS' | 'FAIL' | 'CACHE HIT' | 'RESULT CACHED' | 'CACHE INVALIDATED', details?: Record<string, any>)`
- `logError(context: string, requestId: string, action: string, error: unknown, details?: Record<string, any>)`

This is the only logging touchpoint most of the codebase uses — 121 files across `src/modules` import/inject `AppLogger`, including every `*.service.ts`, `*.validator.ts`, `*.builder.ts`, and `*.controller.ts` in `orders`, `roles`, `labels`, `inventory-areas`, `dynamic-properties`, and `auth`. Most of these don't call `logAction`/`logError` themselves — they just receive `logger: AppLogger` in their constructor and forward it into `super(...)` on `ServiceBase` (`src/common/base/service.base.ts`), which calls `this.logger.logAction(...)` for `FIND_ALL`, `FIND_ONE` (not-found case), and `FIND_ENTITIES_BY_ID`, and also constructs a `DataBaseExceptionHandler` (`src/common/exceptions/database-exception.handler.ts`) with that same `logger`, which calls `logger.logError(...)` whenever a TypeORM error is caught. `AuthService`/`AuthController` are the clearest direct callers, logging `'Authentication'`/`'SIGN IN'` actions with `REQUEST`/`SUCCESS`/`FAIL` statuses.

Relationship to the global pino config: `AppModule` configures `LoggerModule.forRoot` with `genReqId: (req) => req['requestId']` and `customProps: (req) => ({ requestId: req['requestId'] })`, plus a `pino-pretty` transport. That `req['requestId']` is set by `RequestIdMiddleware` (`src/common/middleware/RequestIdMiddleware.ts`), applied to all routes, which reads `x-request-id` or generates one via `randomUUID()` and also stores it in `RequestContextService` for retrieval outside the HTTP request object. So the global pino setup already auto-tags HTTP-request-scoped log lines with `requestId`; `AppLogger`'s methods additionally take an explicit `requestId` parameter (typically sourced from `RequestContextService.getRequestId()`) so the same id can be threaded through structured `context`/`action`/`status` fields independent of pino's own HTTP binding.

**Both `logAction` and `logError` bodies in `app-logger.ts` are entirely commented out.** The calls to `this.logger.log({...})` and `this.logger.error({...})` are wrapped in block comments, so both methods currently compile and are called all over the codebase but do nothing at runtime — no pino output is produced from any `AppLogger` call site today. The only actual logging currently observable in this app is nestjs-pino's own `pinoHttp` request/response logging configured in `app.module.ts`.

## Enforced Patterns

- Domain code is expected to inject `AppLogger` rather than injecting `Logger` from `nestjs-pino` directly — every usage found across `src/modules` follows this convention, and `ServiceBase`/`DataBaseExceptionHandler` in `src/common/` are hard-wired to expect an `AppLogger` instance in their constructors, not a raw pino `Logger`. This centralizes the structured `context`/`requestId`/`action`/`status` shape.
- `status` on `logAction` is a closed string-literal union (`'REQUEST' | 'SUCCESS' | 'FAIL' | 'CACHE HIT' | 'RESULT CACHED' | 'CACHE INVALIDATED'`) — callers cannot invent new status strings without editing `app-logger.ts`, which keeps log statuses enumerable and consistent across modules.
- Callers are expected to supply `requestId` explicitly rather than relying on pino's `customProps` request-scoping to inject it implicitly — the established pattern is `const requestId = this.requestContextService.getRequestId();` at the top of a service/controller method, then passing that same `requestId` into every `logAction`/`logError` call in that method.
- Beyond the above, this directory does not enforce much else — there's no level-mapping logic, no formatter, no sampling/redaction, and (as noted in Overview) the method bodies that would actually emit logs are currently disabled. Anyone re-enabling `logAction`/`logError` should be aware that doing so will suddenly produce log volume from all 121 existing call sites, since none of them were written expecting the methods to be no-ops.

## Gotchas
