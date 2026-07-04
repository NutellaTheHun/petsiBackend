# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # dev server with watch
npm run build         # production build (nest build)
npm run lint          # eslint --fix across src/ and test/
npm run test          # all unit tests (serial --runInBand)
npm run test:watch    # unit tests in watch mode
npm run test:e2e      # e2e tests (test/jest-e2e.json)
npm run seedTestDb    # seed the test PostgreSQL database
npm run clearTestDb   # wipe the test PostgreSQL database
npm run generate:types  # generate OpenAPI types into ../petsi-frontend/src/api-types.ts
```

To run a single test file:

```bash
npx jest --runInBand src/modules/orders/services/order.service.spec.ts
```

## Architecture

NestJS + TypeORM + PostgreSQL backend for a restaurant/food-ordering app.

### Directory layout

- `src/common/base/` — abstract base classes shared by all modules
- `src/common/exceptions/` — global exception filter, typed HTTP exceptions, DB error handler
- `src/common/validation/` — business-rule validation helpers (separate from class-validator)
- `src/infrastructure/database/typeorm/` — two TypeORM configs: prod and testing
- `src/modules/<domain>/` — one NestJS module per domain (orders, menu-items, recipes, etc.)
- `src/modules/revision-history/` — generic change-history table used across domains

### Base class hierarchy and lifecycle hooks

See `src/common/base/CLAUDE.md`.

### Change detection + revision history

Every domain entity's `ServiceBase` can wire up a `ChangeDetectorBase` to diff an incoming update DTO against the current entity; when a detector is present, `update` short-circuits to a no-op if nothing changed, and only the changed-field patch reaches `updateEntity`. Domains that track history persist a versioned snapshot + change log from that diff via `RevisionHistoryService`. Revision-history internals and pruning-cron details: see `src/modules/revision-history/CLAUDE.md`.

### Database configuration

`selectTypeOrmModule()` picks the config by `NODE_ENV`: non-`production` uses `TypeORMPostgresTesting`, which reads `DB_TEST_DATABASE` and sets `synchronize: true`. Production uses `TypeORMPostgresProd` (no synchronize).

### Testing

Tests are always run sequentially with the --runInBand flag.

Tests hit a **real PostgreSQL database** (`DB_TEST_DATABASE`) — no mock repositories.

Each module ships a `*-testing.module.ts` with a factory function (e.g., `getOrdersTestingModule()`). Pass service class overrides via the options object to inject testable subclasses. `RevisionHistoryService` is mocked by default in all testing modules; pass `mockRevisionHistory: false` to test against the real table.

`DatabaseTestContext` registers cleanup callbacks and executes them LIFO to respect FK constraints. Use it as a safety net for entities that don't have an explicit delete test.

`TestRequestContextService` is the mock for `RequestContextService` injected in all testing modules.

#### Test pattern — atomic tests with unique prefix

Every spec file that touches the database must follow this pattern:

**1. Unique prefix per file**
```typescript
const P = `t${Date.now()}`;
```
All entity names created in the file use this prefix (e.g., `${P}-food-cat`). This prevents cross-run conflicts when a previous test run left entities behind.

**2. Two-tier setup**
- `beforeAll` — bootstrap the NestJS testing module + create reference data (categories, vendors, packages — entities that tests read but never mutate) using the unique prefix. `afterAll` deletes them in FK-safe order.
- `beforeEach` / `afterEach` — for entities created by individual tests. Each test registers its created entities on a per-test `DatabaseTestContext` that is flushed in `afterEach`.

```typescript
let testCtx: DatabaseTestContext;
beforeEach(() => { testCtx = new DatabaseTestContext(); });
afterEach(async () => { await testCtx.executeCleanupFunctions(); });
```

**3. Entity lifecycle as explicit describe chains**
When testing create → update → delete on the same entity, use a shared variable within a `describe` block and reference entities by ID — never by querying `{ where: {} }` or `{ take: 1 }`.

```typescript
describe('item lifecycle', () => {
    let item: InventoryItem;

    it('should create', async () => {
        item = await service.create({ name: `${P}-item`, categoryId: category.id, ... });
        expect(item.id).toBeDefined();
    });

    it('should update', async () => {
        await service.update(item.id, { name: `${P}-item-updated` });
        const reloaded = await repo.findOneOrFail({ where: { id: item.id } });
        expect(reloaded.name).toBe(`${P}-item-updated`);
    });

    it('should delete', async () => {
        await service.remove(item.id); // self-cleaning — no cleanup registration needed
        await expect(service.findOne(item.id)).rejects.toThrow(NotFoundException);
    });
});
```

**4. Seed helpers — fine-grained, return entities**
Reference data setup belongs in small composable helper functions, not a single monolithic `initXTestDatabase`. Each helper accepts `P` and the relevant repos, creates one layer of the dependency chain, and returns the created entities as a typed object. The caller is responsible for cleanup.

```typescript
// helper
async function seedCategory(repo: Repository<InventoryItemCategory>, P: string) {
    return repo.save({ name: `${P}-food-cat` });
}

// beforeAll
category = await seedCategory(categoryRepo, P);

// afterAll
await categoryRepo.delete(category.id);
```

#### What to test and what to skip

**Always test:**
- Business rule validation (validator specs) — existence checks, value constraints, duplicate name rules
- Create / update / delete entity lifecycle through the service
- Search and filter logic in `findAll` — assert your created entity appears in results, assert it's excluded when filtered out
- Change detector short-circuit — assert `updateEntity` is not called when DTO matches entity (use `jest.spyOn`, lives in service spec)
- Validation exception propagation — one test per controller verifying the validator is wired correctly end-to-end
- `findOne` throws `NotFoundException` for a non-existent ID — one per service spec, use sentinel `9_999_999`

**Never write:**
- `it('should be defined')` — if DI fails every other test fails with a clearer error
- `findAll` count tests that compare `service.findAll()` length to `repo.find()` length — tests TypeORM, not your code
- `findAll` sortBy tests — sorting is configured in `ServiceBase`, not domain code; not worth testing per entity
- Controller tests that duplicate what the service spec already covers (findAll, findOne happy path, sortBy)

#### Change detector specs
`ChangeDetectorBase` subclasses are already pure unit tests — plain object construction, no DB, no module bootstrap. Keep them exactly as they are. Do not add seeding or async DB calls to these files.

### Auth and roles

- Global `AuthGuard` (JWT) and `RoleGuard` are applied via `APP_GUARD` in `AppModule`.
- Use `@PublicLogin()` on routes that should skip JWT verification.
- Use `@Roles(...roles)` on routes/controllers that require specific roles.

### Caching

`ControllerBase` caches `findAll` and `findOne` results for 60 s using in-memory `CacheModule`. All `findAll` cache keys for a service prefix are tracked so they can be bulk-invalidated when create/update/remove runs. Cache lives in the container process; there is no shared external cache.
