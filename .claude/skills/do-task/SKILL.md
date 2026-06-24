---
name: do-task
description: Pick up and complete one task file from prd/<slug>/tasks/, end-to-end, in a fresh context. Reads only what's needed — never the whole PRD. Usage- /do-task <prd-slug> [task-number-or-filename]
disable-model-invocation: true
---

# Do Task

Complete exactly one vertical-slice task, fully and independently. Assume you have NO memory of prior sessions — everything you need must come from the task file, the source PRD's decision sections, and the codebase itself.

## Input

The user invokes this as `/do-task <prd-slug>` or `/do-task <prd-slug> <task-number-or-filename>`.

- `<prd-slug>` is required — it's the folder name under `prd/`. Tasks live at `prd/<prd-slug>/tasks/`.
- The task number/filename is optional. If omitted, select automatically (see step 1).

If `prd/<prd-slug>/tasks/` doesn't exist, say so and stop — don't guess at a different slug.

## Process

### 1. Select the task

If the user specified a task (number or filename), use the matching file in `prd/<prd-slug>/tasks/`.

Otherwise:

- List all files in `prd/<prd-slug>/tasks/`.
- Find those with `status: todo` where every file listed in `blocked-by` has `status: done`.
- Pick the lowest-numbered eligible file.
- If none are eligible, report why (e.g. "03 is blocked-by 02, which is still in-progress"; "all tasks are done") and stop.

Immediately set `status: in-progress` in that file's frontmatter before doing anything else, so a re-run won't grab the same task.

### 2. Load minimal context

- Read the selected task file in full.
- Read ONLY the Problem Statement, Solution, Implementation Decisions, and Testing Decisions sections of the source PRD (`prd/<prd-slug>/prd.md`, confirm via the task's `## Source` reference). Skip User Stories unless the task explicitly references specific ones.
- Explore the codebase at the seam(s) implicated by this task, if not already clear.

### 3. Implement the vertical slice

Build the end-to-end behavior described in "What to build" — schema through UI, per the slice rules it was cut along. Follow Implementation Decisions from the PRD exactly; if something there is ambiguous or contradicted by what you find in the code, flag it rather than silently deciding.

### 4. Test

Write tests per the PRD's Testing Decisions and prior art. Run the full relevant test suite, not just new tests.

Test file conventions for this codebase:

Unit tests (pure functions, no database — like convertUnit):

- File: <source-file>.spec.ts placed alongside the source file
- No imports of jest globals — describe, it, expect, beforeEach etc. are ambient (from @types/jest)
- Run with: npx jest --runInBand <path-to-spec>

Integration tests (services, validators, anything touching the DB):

- Same naming convention: <service-name>.service.spec.ts etc.
- Use DatabaseTestContext (from src/test/DatabaseTestContext) to register entity cleanup — always LIFO to respect FK constraints
- Bootstrap via the module's get<Domain>TestingModule() factory (found in \*-testing.module.ts in the same module directory)
- Use beforeAll/afterAll (not beforeEach) for the module setup
- To test createEntity/updateEntity directly, subclass the service with \*ForTest wrapper methods that expose protected hooks
- Run with: npx jest --runInBand src/modules/<domain>/services/<name>.service.spec.ts

Never mock repositories — all integration tests hit a real PostgreSQL DB (DB_TEST_DATABASE). RevisionHistoryService is mocked by default in all testing modules.

### 5. Resolve and report

- Check off each acceptance criterion you actually verified.
- If all are met: set `status: done`.
- If some aren't: leave `status: in-progress`, list what's unmet and why, and stop — do not mark done.
- Summarize what changed and any deviations from the plan in your final message.

Do NOT modify the source PRD file. Do NOT touch other task files except to read their `status`/`blocked-by` for selection. Do NOT handle git operations (branching, committing, pushing) — that's managed outside this skill.
