status: todo
blocked-by: [01-init-local-skill-pilot-orders.md]

---

## Source

`prd/claude-md-hierarchy/plan.md`

## What to build

Run `/init-local` against the remaining 16 directories to give every domain module and shared-foundation directory its own local `CLAUDE.md`, completing the 18-directory scope from the plan (`src/modules/orders`, done in task 01, plus `src/common/base` and `src/modules/revision-history`, done in task 02, leaves 16: the other 3 shared-foundation dirs and 12 domain modules).

**Order of preference** (per the plan, not strictly time-boxed):
1. The remaining 3 shared-foundation directories: `src/common/exceptions`, `src/common/validation`, `src/infrastructure/database/typeorm`.
2. The remaining 12 domain modules under `src/modules/` (all `src/modules/<domain>/` directories other than `orders` and `revision-history`, which already have theirs).

Not a hard blocker on tasks 02–05 completing first, but the plan recommends running this once the `/init-local` skill (task 01) and the rest of the debrief loop (tasks 02–05) have been validated, since the whole point of the local files is to eventually receive Gotchas entries through that loop.

Each directory gets a `CLAUDE.md` via a separate `/init-local <path>` invocation — no bulk/`--all` mode exists, so this is 16 individual runs. Each can reasonably be its own small unit of work (e.g. picked up incrementally as those directories are touched for other feature work), rather than one big batch.

## Acceptance criteria

- [ ] All 4 shared-foundation directories have a `CLAUDE.md` (`src/common/base` and `src/modules/revision-history` from task 02, plus `src/common/exceptions` and `src/common/validation` and `src/infrastructure/database/typeorm` from this task)
- [ ] All 14 `src/modules/<domain>/` directories have a `CLAUDE.md` (`orders` from task 01, `revision-history` from task 02, the remaining 12 from this task)
- [ ] Each generated file follows the fixed template (Overview, Enforced Patterns, empty Gotchas) and was spot-checked for accuracy against its directory's actual code
- [ ] Total of 18 local `CLAUDE.md` files exist across the codebase, matching the plan's scope decision
