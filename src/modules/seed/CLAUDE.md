---
module: src/modules/seed
last_reviewed: 2026-07-04
---

## Overview
`SeedService` populates the Postgres database with baseline reference and sample data across every domain module: inventory-areas, inventory-items, labels, menu-items, orders, recipes, templates, roles, and users. It is invoked two ways:
- `npm run seedTestDb` → `src/scripts/db/seedTestDb.ts`, which boots a full Nest application context from `AppModule` and calls `seedService.seedTestDb()` with no `ctx`, so each call creates its own internal `DatabaseTestContext`.
- Directly from `seed.service.spec.ts`, which passes in its own `DatabaseTestContext` and asserts every domain's `findAll()` returns a non-empty result afterward.

`SeedModule` imports every domain module it seeds (`InventoryAreasModule`, `InventoryItemsModule`, `LabelsModule`, `MenuItemsModule`, `OrdersModule`, `RecipesModule`, `TemplatesModule`, `RoleModule`) plus registers `User`/`Role` repositories directly via `TypeOrmModule.forFeature`, since roles/users seeding lives inline in `SeedService` rather than behind a dedicated test util.

`seedTestDb()` drives seeding in FK-dependency order — inventory areas → inventory items → labels → menu items → orders → recipes → templates → roles → users — with each domain's step delegated to that domain's own `*TestUtil`/`*TestingUtil` class (e.g. `InventoryAreaTestUtil`, `RecipeTestUtil`). Domain seeding within a module is itself layered (e.g. inventory items seeds category → package → vendor → item → size in that order) to satisfy FK constraints.

Role/user seeding (`seedRoleTestDb`, `seedUserTestDb`) is idempotent: it looks up each fixed name (`admin`/`manager`/`staff`) before inserting, so re-running the seed script against an already-seeded database is safe. `seedUserModuleTestDb` always calls `seedRoleTestDb` first since user creation assigns roles by name lookup. `seedRolesAndUsers` is a near-duplicate of this same role/user logic but is only referenced from a commented-out block in `seed.service.spec.ts` — it is not part of the `seedTestDb()` call graph.

## Enforced Patterns
- Seeding methods here call the domain test utils' legacy `init<Entity>TestDatabase(ctx)` methods (idempotent, fixed entity names, existence-checked via `findOne` before `save`) — **not** the newer prefix-based `seed<Entity>(P)` helpers that atomic test specs use for per-test isolation. Do not swap these to the `P`-prefixed variants; that would break idempotency of `npm run seedTestDb` against a database that already has seed data.
- Seed order within `seedTestDb()` follows each domain's FK dependency chain (parent entities before children, e.g. category/package/vendor before item, item before size). New seed steps must be inserted at the correct point in this chain, not appended at the end.
- Every seeding step accepts and threads through the same `DatabaseTestContext` (`ctx`) passed into `seedTestDb()`, so callers can register cleanup or share context across the whole seed run.

## Gotchas
