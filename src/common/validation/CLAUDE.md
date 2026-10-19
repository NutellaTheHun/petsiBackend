---
module: src/common/validation
last_reviewed: 2026-10-16
---

## Overview

`src/common/validation` is the runtime, business-rule layer of validation — distinct from the class-validator decorators on DTOs (which only check shape/type of a single incoming payload). Everything here operates on a `ValidatorIdentityBaseInterface`-shaped "identity" (an object with optional `id`/`createId`, resolved from a DTO) and often needs to consult the database (uniqueness, existence, cross-entity constraints), which class-validator decorators can't do cleanly. The five files in this directory are:

- **`validatator-helper.ts`** — `ValidatorHelper<TEntity, TDto, TIdentity>`, a stateless grab-bag of reusable business-rule checks (existence, uniqueness, numeric bounds, conditional/mutual-required fields, duplicate-detection, etc). This is the real "meat" of the directory; almost everything else exists to support it.
- **`validation-error.ts`** — `ValidationErrorMap`, the mutable error tree every check writes into, plus `ValidationErrorResponse`/`ValidationErrorPayload` (the client-facing shapes) and test helpers (`findValidationErrorResponseByPath`, `expectValidationErrorPayload`, `expectValidationErrorCode`, `expectValidationErrorSize`) used throughout `*.validator.spec.ts` suites.
- **`validation-error-codes.ts`** — the closed `ValidationErrorCode` union plus `VALIDATION_ERROR_CODE_LOGGED`, the fixed code → logged/not-logged table (see "Code vocabulary and classification"). Every error added anywhere must use one of these codes.
- **`validation-exception.ts`** — `ValidationException`, a plain `Error` subclass built from a `ValidationErrorMap`. It exposes `errors` (the client-facing `ValidationErrorResponse`, from `buildResponse()`) and `errorMap` (the source tree, with log-only context, read by the filter).

**DTO shape failures never reach this layer.** The global `ValidationPipe` (`src/app.setup.ts`) has a custom `exceptionFactory` that throws `DtoValidationException` (`src/common/exceptions/dto-validation-exception.ts`), which holds the raw class-validator errors and the DTO class name. `GlobalHttpExceptionFilter` maps it to 400 `code: 'INVALID_REQUEST'` with a generic message and `details: { fields }`, a flat, de-duplicated list of dotted paths with array indexes as segments (`orderedItems.2.quantity`, or `unknownProp` for whitelist violations). It logs one `warn` entry with `source: 'dto'`, `dto` (class name) and `constraints: [{ path, constraint }]`. Submitted values, `target` and constraint messages never reach the response or the log. DTO checks mirror the frontend's checks, so a shape failure is always a frontend bug. That's why it's logged and isn't mapped into the `ValidationErrorMap` tree, and why indexes aren't converted to `id`/`createId`.

**Nested items always carry `id` or `createId` by the time a validator sees them.** Nested arrays route each item to the create DTO when `createId` is present and to the update DTO otherwise (`@Transform` + `plainToInstance`). `NestedCreateDto.createId` is `@IsString() @IsNotEmpty()` and `NestedUpdateDto.id` is `@IsInt() @IsPositive()`, so an item with neither (or with `id: 0`) is rejected as `INVALID_REQUEST`. The `throw`s in `ValidatorBase.validateNestedIdentity` and `enforceNoDuplicateElements` remain as safeguards against validator bugs and can't be reached over HTTP.

How it's wired into the base-class hierarchy (`src/common/base`): every domain validator extends `ValidatorBase<T, I>` (or `NestedValidatorBase<T, I>` for validators only ever invoked as children). `ValidatorBase`'s constructor instantiates a fresh `ValidatorHelper<...>()` and exposes it as `protected helper`, so every subclass calls checks as `this.helper.enforceXxx(...)`. `ValidatorBase.validateDto` first calls the subclass's `resolveIdentity(dto, id)` to turn a create/update DTO into `I`, then calls the abstract `validateIdentity(identity, id)` which subclasses implement by building a `new ValidationErrorMap(id)` and threading it through one or more `this.helper.enforceXxx(...)` calls (and/or nested `validateNestedIdentity` calls). `ValidatorBase.validate(dto, id)` returns the non-empty `ValidationErrorMap` (or `null`); `validateDto` wraps it and returns `buildResponse()` (what validator specs assert on). `ServiceBase.create`/`update` call `validate` and throw `new ValidationException(errorMap)` when it's non-null. `GlobalHttpExceptionFilter` (`src/common/exceptions/global-http-exception-filter.ts`) catches it and returns HTTP 400 with `code: 'VALIDATION_ERROR'` and `details.validationErrors` set to `exception.errors`. If the tree contains any logged code, it also writes one `warn` entry (see below). To bypass validation in a test, spy on `validate`, not `validateDto`.

Grepping `src/modules` confirms real adoption: `enforceExists` (16 files), `enforceUnique` (17 files), `enforceNoDuplicateElements` (6 files), `enforcePositive` (10 files), `enforceValidSize` (4 files), `enforceConditionalRequired`/`enforceOnlyOne` (2 files each), `enforceMutualRequired`/`enforcePropertyState` (1 file each) — `enforceArrayNotEmpty`, `enforceNonNegative`, `enforceValueInList`, and `enforceNotInList` currently have zero call sites in `src/modules`.

**Key relationships:**
- `ValidatorBase`/`NestedValidatorBase` (`src/common/base/validator.base.ts`, `nested-validator.base.ts`) own the `ValidatorHelper` instance and the `validateIdentity`/`resolveIdentity` contract; this directory only supplies the checks and the error-tree data structure, never the orchestration.
- `ValidationErrorMap` is the single mutable object passed by reference through an entire validation pass — from the root `ValidatorBase.validateIdentity` down through every `ValidatorHelper.enforceXxx` call and every nested `validateNestedIdentity` call (`addChild`).
- `ServiceBase.create`/`update` and `GlobalHttpExceptionFilter` are the only consumers of `ValidationException`. Validators and `ServiceBase` never log; `GlobalHttpExceptionFilter` is the only component that decides whether a validation failure is logged.
- The test helpers in `validation-error.ts` are the standard way `*.validator.spec.ts` files assert on nested error trees (see `src/modules/roles/validators/role.validator.spec.ts`, `src/modules/orders/validators/order-container-item.validator.spec.ts`).

## Enforced Patterns

### Division between DTO and business validator

The DTO (class-validator) checks exactly what the frontend checks: presence, type, dropdown/enum membership (`@IsIn`/`@IsEnum`), and identifier format (`@IsPositive` on `*Id`/`*Ids`). Every rule about a value the user types — positivity, bounds, date ordering, matching a variable max — lives only in the domain validator and emits `OUT_OF_RANGE`. Never put `@IsPositive`/`@Min`/`@Max` on a user-typed field: it fires first and turns a field-level error into a generic `INVALID_REQUEST`. Don't repeat a DTO-enforced membership check in a validator; checks that combine several fields (occurrence type vs `templateOrderId`/`recurrenceSchedule`) stay in the validator as `INCONSISTENT_STATE`.

### Code vocabulary and classification

Each code tells the frontend what to show and tells the filter whether to log. When a rule doesn't fit cleanly, prefer `INCONSISTENT_STATE` if the frontend assembles the value (dropdowns, pickers, nested-item wiring) and `OUT_OF_RANGE`/`CONFLICTING_VALUES` if the user types it. `VALIDATION_ERROR_CODE_LOGGED` is typed `Record<ValidationErrorCode, boolean>`, so adding a code without classifying it is a compile error.

| Code | Logged | Meaning |
|---|---|---|
| `ALREADY_EXISTS` | no | uniqueness |
| `MISSING_PROPERTY` | no | a user-filled field is missing (incl. conditional requirements) |
| `OUT_OF_RANGE` | no | positivity, bounds, date ordering, quantity vs. a variable max |
| `CONFLICTING_VALUES` | no | cross-field conflicts the user can resolve |
| `REFERENCE_NOT_FOUND` | yes | a referenced row doesn't exist |
| `INVALID_REFERENCE` | yes | the referenced row exists but isn't valid here (size not offered, wrong category, wrong state) |
| `INCONSISTENT_STATE` | yes | combinations the frontend assembles that are inconsistent |
| `IMMUTABLE_FIELD` | yes | a change to a field the UI never exposes for editing |
| `DUPLICATE_ITEMS` | yes | duplicates in a nested collection (the UI prevents them) |

Logged codes are anomalies: the user couldn't have caused them through the UI. For a `ValidationException` whose tree has any logged code, the filter writes one `warn` entry with `source: 'business'` and `errors: [{ path, code, fields, ids, value }]`, built by `ValidationErrorMap.collectLoggedErrors()`. It lists only logged errors. `path` is nested `prop[id]` segments joined by `.` (`containerMenuItems[c1]`), and `''` for errors on the root entity. `value` comes from the log-only context. A tree with only non-logged codes produces no filter log entry.

### Log-only context

`addError(code, ids?, fields?, logContext?)` accepts `{ value: string | number }`, the identifier that was checked. It's stored on the map's `errors` (`StoredValidationError`). `buildResponse()` strips it, so it never reaches `ValidationErrorResponse`/`ValidationErrorPayload` or the client. Only identifier values go here, never free text. `enforceExists`, `enforceValidSize` and `enforcePropertyState` attach the id they checked.

### Validators never throw for problems with incoming data

A `throw` inside a validator (or builder) only signals a bug in the validator itself. A missing or invalid reference is a validation code, not a 404/`Error`. `enforceValidSize` and `enforcePropertyState` add `REFERENCE_NOT_FOUND` when the looked-up entity is missing. `BuilderBase` not-found paths throw `AppHttpException(400, 'REFERENCE_NOT_FOUND', { id | ids | name })`, which the filter logs at `warn` with `id`/`ids` (never `name`).

### Helper checks

`ValidatorHelper` standardizes these business-rule categories, each returning a fixed `ValidationErrorCode`:

- **Existence** — `enforceExists` checks a foreign id exists via `repo.findOne({ where: { id } })` against the **database**, not any in-memory candidate list, and emits `REFERENCE_NOT_FOUND` (id as log-only context). `enforcePropertyState` also hits the DB: a missing entity adds `REFERENCE_NOT_FOUND`, and `entity[field] !== targetValue` adds `INVALID_REFERENCE`. Both go on the compared `field` (e.g. `type`), not the reference field, and the caller usually also runs `enforceExists`, so a missing id yields two `REFERENCE_NOT_FOUND` errors.
- **Nested ownership** — `enforceNestedOwnership` does one batched `find` (`loadRelationIds` on the parent relation) and puts its error on the nested item's own child map (field `id`, the id as log-only context). `ValidationErrorMap.addChild` merges children with the same `id` under a field, so a helper error and that item's `validateNestedIdentity` errors appear as one entry.
- **Uniqueness** — `enforceUnique` queries `repo.find({ where: { [field]: val } })` against the DB and adds `ALREADY_EXISTS` if any matching row's `id` differs from the identity's own `id`/`createId`. This is an **exact-match, case-sensitive** database query (no normalization anywhere in this file or in call sites checked) — two names differing only in case both pass as "unique."
- **Value constraints** — `enforcePositive` (`> 0`) and `enforceNonNegative` (`>= 0`) emit `OUT_OF_RANGE`. `enforceValueInList` (dropdown-style membership) emits `INCONSISTENT_STATE`; `enforceNotInList` (a reserved/forbidden value) emits `CONFLICTING_VALUES`. `enforceValidSize` (a size id must appear in a foreign entity's array-valued relation) emits `INVALID_REFERENCE` (size id as context). If the foreign entity is missing, it emits `REFERENCE_NOT_FOUND` on the size `field` (foreign id as context). All of these **short-circuit to a no-op when the value is `null`/`undefined`**, so callers must gate optional-field checks themselves if "field is required" is also a rule (see `OrderMenuItemValidator` guarding `if (identity.quantity !== undefined)` before calling `enforcePositive`).
- **Conditional/mutual requirements** — `enforceConditionalRequired(identity, hinge, hingeValue, dependents, errMap)` requires all `dependents` be non-null/non-empty when `identity[hinge] === hingeValue` (emits `MISSING_PROPERTY` per missing dependent); used by `OrderValidator` to require `deliveryAddress`+`phoneNumber` when `fulfillmentType === 'delivery'`. `enforceMutualRequired(dto, mutuals, errMap)` requires a group of properties be all-present or all-absent (one `CONFLICTING_VALUES` listing every field in the group) — used in `recipe.valdiator.ts`. `enforceOnlyOne(identity, first, second, errMap)` requires exactly one of two properties populated (one `INCONSISTENT_STATE` on both fields, for both-populated and both-empty) — used in `InventoryAreaItemValidator`/`RecipeIngredientValidator` for "reference by nested-create OR by existing id, never both/neither."
- **Array integrity** — `enforceArrayNotEmpty` requires a non-empty array (`MISSING_PROPERTY`); `enforceNoDuplicateElements(items, keyExtractor, field, errMap)` builds a map from a caller-supplied key to colliding item ids and emits one `DUPLICATE_ITEMS` error per colliding key with `ids` set to all colliding item ids. **Gotcha:** if `keyExtractor` returns `id == null` (an item with neither a persisted `id` nor a `createId`), this throws a synchronous `Error('id is required')` rather than adding a validation error — a malformed nested DTO here crashes the request instead of producing a 400. Over HTTP this can't happen, because the nested DTO base rules reject such an item first (see Overview). It only matters for callers that bypass the pipe.

**Contract a domain validator must follow to use these helpers correctly:**
1. Instantiate nothing — `this.helper` is already provided by `ValidatorBase`'s constructor; just call `this.helper.enforceXxx(...)`.
2. Create exactly one `ValidationErrorMap` per `validateIdentity` call, `new ValidationErrorMap(id)`, and pass that same instance (by reference) into every helper call and every nested `validateNestedIdentity` call — helpers mutate it in place; they never return a new map.
3. `errorMap.addError(code, ids?, fields?, logContext?)` throws synchronously if `fields` is passed as an empty array — never call `addError` with `fields: []`; omit `fields` entirely instead.
4. For nested identities, never call the child validator's `validateIdentity` directly — call `childValidator.validateNestedIdentity(fieldName, childIdentity, rootErrorMap)` (defined on `ValidatorBase`). It resolves the child's own id (throwing if neither `id` nor `createId` is set), runs the child's `validateIdentity`, and only calls `rootErrorMap.addChild(field, childErrors)` if the child's map is non-empty.
5. Checks are async when they hit the DB (`enforceExists`, `enforcePropertyState`, `enforceUnique`, `enforceValidSize`) and synchronous otherwise. A DB check called without `await` races the rest of `validateIdentity` and can drop its error. There is no aggregate ordering or short-circuit: `validateIdentity` implementations run every applicable check regardless of whether an earlier one already failed, so a single field can accumulate multiple error codes in one response.
6. Helpers take no message parameter. The only per-error customization available is the fixed `ValidationErrorCode` plus optional `ids`/`fields` arrays and the log-only `logContext`.
7. `IMMUTABLE_FIELD` is a valid code but has no corresponding `ValidatorHelper` method — `DynamicPropertyConfigValidator` calls `errorMap.addError('IMMUTABLE_FIELD', ...)` directly. This is the sanctioned escape hatch: when a business rule doesn't fit an existing `enforceXxx`, add errors straight to the `ValidationErrorMap` with an existing code rather than inventing a new helper or a new code without updating `validation-error-codes.ts` (a new code must also be classified in `VALIDATION_ERROR_CODE_LOGGED`).

## Gotchas
