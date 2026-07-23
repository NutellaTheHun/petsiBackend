---
task: prd/dynamic-reporting/tasks/02-field-registry-schema.md
date: 2026-07-23
outcome: done
tags: []
tools-used: [Bash, Edit, Read, Write]
tools-requested-but-missing: []
modules-touched: [src/modules/reports]
---

## What happened

The agent added the field registry layer and `ReportSchemaService` on top of the task-01 scaffolding. All new files are uncommitted (task 02 work was not committed separately; the working tree is clean except for these additions).

Files written:
- `src/modules/reports/registries/field-registry.types.ts` — `FieldRegistryEntry`, `EntityRegistryEntry`, `FieldRegistry` types; `FieldJoin` interface uses plural `joins?: FieldJoin[]` (array) rather than the singular `join?` shape described in the PRD, to support multi-hop joins (e.g. `orderMenuItem → menuItem → category`)
- `src/modules/reports/registries/orders.registry.ts` — 6 fields: `fulfillmentDate`, `fulfillmentType` (enum: pickup/delivery), `recipient`, `isFrozen`, `note`, `deliveryAddress`
- `src/modules/reports/registries/order-menu-items.registry.ts` — 6 fields: `itemName`, `sizeName`, `quantity` (aggregatable: sum/count/avg), `categoryName`, `categoryId`, and the `children` meta-field (empty `select`, signals nested container expansion to the execution service)
- `src/modules/reports/registries/index.ts` — combines both registries into `FIELD_REGISTRY`
- `src/modules/reports/dto/report-schema.dto.ts` — `FieldSchemaDto`, `EntitySchemaDto`, `ReportSchemaDto`
- `src/modules/reports/services/report-schema.service.ts` — serializes `FIELD_REGISTRY` into `ReportSchemaDto`; strips `select`, `alias`, `joins` from the output
- `src/modules/reports/controllers/report-schema.controller.ts` — `GET /reports/schema` restricted to `ROLE_MANAGER`, `ROLE_ADMIN`
- `src/modules/reports/services/report-schema.service.spec.ts` — 8 pure unit tests; no DB, no module bootstrap

Files modified:
- `src/modules/reports/reports.module.ts` — added `ReportSchemaController` and `ReportSchemaService`
- `src/modules/reports/controllers/report-definition.controller.spec.ts` — added `ReportSchemaController` and `mockSchemaService` to the existing controller test module, plus two new role-enforcement tests for `GET /reports/schema` (403 for staff, 200 for manager)

All 20 tests in `src/modules/reports/` pass (8 schema unit tests, 6 definition service tests, 6 definition controller tests including the 2 new schema route tests).

## Deviations from plan

**`joins` (plural array) instead of `join` (singular object)** — The PRD specifies `join?: { relation, alias }` as a single object on `FieldRegistryEntry`. The implementation uses `joins?: FieldJoin[]` (an array) to support fields like `categoryName` and `categoryId` that require two sequential joins (`orderMenuItem → menuItem → category`). This is a deliberate extension that the execution service will need to handle when it iterates over `joins` rather than reading a single `join`. The spec test for `joins` absence from the schema response explicitly checks for both `join` and `joins`, so the divergence is documented and tested.

**Schema controller tests added to the existing controller spec** — Rather than creating a separate `report-schema.controller.spec.ts`, the two role-enforcement tests for `GET /reports/schema` were appended to the existing `report-definition.controller.spec.ts`. This is consistent with keeping role-guard tests co-located in a single controller spec file for the module.

## Friction points

None. All tests passed on first run.
