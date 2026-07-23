---
module: src/modules/reports
last_reviewed: 2026-07-23
---

## Overview

The reports module lets managers define, store, and execute data reports against order/order-item data. It has three main services:

- **`ReportDefinitionService`** — CRUD for `ReportDefinition` entities. `findAll` is role-aware: staff-only users see only `visibility: 'staff'` definitions; managers/admins see both.
- **`ReportExecutionService`** — executes a saved definition against live data. Resolves each section's entity key through `ENTITY_QUERY_CONFIG`, builds a TypeORM `QueryBuilder` dynamically from the `FIELD_REGISTRY`, applies filters (fixed or runtime-param), optional `groupBy`, and optional aggregates, then returns typed `ReportResultDto` data.
- **`ReportSchemaService`** — exposes the `FIELD_REGISTRY` as a frontend-safe DTO, stripping internal fields (`select`, `alias`, `joins`).

`ReportDefinition` stores its configuration entirely in two JSONB columns (`params: JsonReportParam[]`, `sections: JsonReportSection[]`). Sections are typed discriminated unions: `'text'`, `'table'`, and `'metric'`.

The `FIELD_REGISTRY` (`registries/index.ts`) is the single source of truth mapping entity keys (`orders`, `orderMenuItems`) to their queryable fields. It is shared by execution (query building) and schema (UI discovery).

## Enforced Patterns

**Field registry is the gatekeeper for all query construction.** `ReportExecutionService` resolves every column, filter field, groupBy field, and aggregate field through `FIELD_REGISTRY[section.entity].fields[fieldKey]`. An unknown key throws `AppHttpException(400)` immediately. Never bypass the registry to build raw SQL or add hard-coded selects — all join logic and column aliasing must flow through `FieldRegistryEntry.select`, `FieldRegistryEntry.alias`, and `FieldRegistryEntry.joins`.

**Join deduplication via `addedJoinAliases` set.** Both `processTableSection` and `processMetricSection` track which join aliases have already been added and skip re-adding them. When adding a new field to a registry entry, always declare all required joins in `FieldRegistryEntry.joins`; the execution service will merge them automatically.

**Frozen orders are silently excluded at execution time.** `processTableSection` and `processMetricSection` both apply `isFrozen = false` unconditionally when the entity is `'orders'`. This is an implicit business rule, not a filter the caller controls.

**Visibility is enforced at execution, not just at list time.** `ReportExecutionService.execute` checks `definition.visibility === 'management'` and throws `ForbiddenException` for staff users, even if they somehow obtained the definition ID. Both enforcement points (findAll and execute) read roles from `RequestContextService`.

**`isChildrenExpansion` fields have no `select` value and trigger a separate query.** The `children` field in `orderMenuItemsRegistry` sets `isChildrenExpansion: true` and `select: ''`. The execution service detects this flag, adds `__parentId` to the raw query, then performs a second `orderMenuItemRepo.find` with `In(parentIds)` to hydrate `containerOrderMenuItems`. Do not give expansion fields a real `select` value — it breaks the detection logic.

**Two separate testing modules for different test scopes.** `getReportsTestingModule()` covers definition CRUD (includes only `ReportDefinition`, mocks `ReportExecutionService`). `getReportsExecutionTestingModule()` covers execution (registers all order and menu-item entities so the query builder can join across them). Tests that assert execution behavior must use the execution testing module.

**Aggregate column labels become raw row keys.** Aggregate results are mapped from `__agg_N` keys to the `agg.label` string. If two aggregates share the same label, the second overwrites the first. Ensure labels are unique within a section's `aggregates` array.

## Gotchas
