---

Problem Statement

The current unit of measure system stores units as database entities (UnitOfMeasure, UnitOfMeasureCategory) that must be created and maintained through a REST API. Administrators must manually define conversion factors, which duplicates knowledge that well-established libraries already encode and is error-prone. The conversion logic exists in the codebase but is unused and untested, leaving the system unable to perform unit conversions in practice.

Solution

Replace the database-driven unit of measure system with compile-time constants derived from the convert-units npm package. Unit fields on RecipeIngredient and InventoryItemSize become plain string columns storing package-compatible symbols. A utility function wraps convert-units to perform conversions, making unit conversion available to any future service that needs it.

User Stories

1. As a developer, I want unit symbols to be compile-time constants, so that invalid unit references are caught at build time rather than at runtime.
2. As a developer, I want unit conversions handled by a well-maintained library, so that I don't have to maintain conversion factors in the database.
3. As a developer, I want to convert between compatible units with a simple function call, so that I can implement features like recipe scaling or inventory aggregation without building conversion logic from scratch.
4. As a developer, I want unsupported unit conversions to throw a typed error, so that I can handle them explicitly at the callsite.
5. As a developer, I want dimensionless/count units (ea) to be supported as a first-class concept, so that recipe ingredients and inventory items measured by count are not excluded from the system.
6. As a developer, I want the supported unit set to be a curated subset, so that the system only exposes units that have been validated against real data.
7. As an API consumer, I want unit fields to return a plain string symbol instead of a nested entity object, so that I can work with units without additional lookups or joins.
8. As an API consumer, I want invalid unit symbols rejected at the API boundary with a validation error, so that corrupt data cannot enter the system.
9. As an API consumer, I want frontend TypeScript types to reflect the new unit field shapes, so that the frontend compiler enforces correct usage.
10. As an admin, I want to stop managing units of measure through the API, so that I no longer have to manually seed conversion factors or worry about data inconsistencies.

Implementation Decisions

Removed entirely

- UnitOfMeasure and UnitOfMeasureCategory database tables
- All CRUD REST endpoints for units of measure and unit of measure categories
- The unit-of-measure NestJS module and all its associated files (entities, services, controllers, DTOs, validators, builders, change detectors, testing utilities)

New: src/common/units/

Three files — no NestJS module registration; these are plain utilities importable anywhere:

- constants.ts — a UNITS const object covering the supported subset of convert-units symbols plus 'ea' for dimensionless/count units. Also exports the AppUnit type.
- convert.ts — the convertUnit function and UnitConversionError.
- index.ts — re-exports everything from the above two files.

AppUnit type

Derived from the convert-units package's own exported Unit type, extended with the app-level 'ea' constant:
AppUnit = Unit | 'ea'
The compiler enforces valid symbols everywhere AppUnit is used. If convert-units updates its unit list, the type updates automatically.

Supported units (current subset only)

- Weight: kg, g, lb, oz
- Volume: Tbs, tsp, cup, ml, l, gal, fl-oz, qt, pnt
- Dimensionless: ea (app-level constant, not from convert-units)

convertUnit function

Signature: convertUnit(value: number, from: AppUnit, to: AppUnit): number

- Delegates to convert-units for all measurable units
- ea → ea is a valid no-op (returns value unchanged)
- Any other conversion involving ea throws UnitConversionError
- Cross-category conversions (e.g. kg → cup) throw UnitConversionError, wrapping the error from convert-units
- Returns a plain number (not Big)
- UnitConversionError is a plain Error subclass — no HTTP semantics; callers in services rethrow as BadRequestException if needed

Entity field changes

- RecipeIngredient.quantityUnitType: UnitOfMeasure (ManyToOne FK) → RecipeIngredient.unit: AppUnit (varchar column)
- InventoryItemSize.measureType: UnitOfMeasure (ManyToOne FK) → InventoryItemSize.unit: AppUnit (varchar column)

DTO validation

Unit fields validated at the HTTP boundary with @IsIn(Object.values(UNITS)). No database lookup required.

Database migration strategy

Schema is managed via synchronize: true (non-production). Existing data is wiped and reseeded. Test seeding utilities and integration tests are updated to use AppUnit string values in place of UnitOfMeasure entity IDs.

Frontend types

npm run generate:types is run as part of this change to regenerate the frontend API types file, reflecting the updated field shapes on RecipeIngredient and InventoryItemSize.

No conversion callers introduced

convertUnit is introduced but not wired to any caller in this change. Callers are deferred to future features.

Testing Decisions

What makes a good test

Test external behavior only — what the API accepts and returns, or what a function returns given inputs. Do not test TypeORM internals, NestJS module wiring, or class-validator decorator mechanics in isolation.

Seam 1: convertUnit unit tests (new)

Pure function, no DB required. Cover:

- Valid same-category conversions (e.g. kg → lb, cup → ml)
- ea → ea returns value unchanged
- Cross-category conversion throws UnitConversionError
- ea → kg throws UnitConversionError

Seam 2: RecipeIngredient existing integration tests (updated)

The existing RecipeIngredient controller/service spec (real PostgreSQL, no mock repositories) is updated to pass unit: 'kg' (an AppUnit string) instead of quantityUnitTypeId: number, and to assert responses include unit: 'kg' instead of a nested quantityUnitType entity object. Invalid unit strings should be rejected with a validation error.

Seam 3: InventoryItemSize existing integration tests (updated)

Same pattern as RecipeIngredient.

Prior art

All integration tests follow the DatabaseTestContext + real PostgreSQL pattern established across the codebase. TestRequestContextService is used for auth mocking. The existing recipe-ingredient and inventory-item-size specs are the direct prior art.

Deleted tests

All unit-of-measure spec files are deleted alongside the module.

Out of Scope

- Any service actually calling convertUnit (no callers introduced in this change)
- Adding units beyond the current supported subset
- A database check constraint enforcing valid unit symbols at the DB level
- Frontend component changes beyond regenerating API types
- Revision history tracking for the removed entities

Further Notes

The ea constant bypasses convert-units entirely and is treated as a dimensionless sentinel. Converting between two ea quantities is always a 1:1 ratio. If future requirements call for converting between discrete-count units or packaging sizes, that decision can be revisited independently of this change.
