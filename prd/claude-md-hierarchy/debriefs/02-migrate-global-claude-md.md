---
task: prd/claude-md-hierarchy/tasks/02-migrate-global-claude-md.md
date: 2026-07-04
outcome: done
tags: [missing-context]
tools-used: [Bash, Read, Edit, Write]
tools-requested-but-missing: []
modules-touched: [src/common/base, src/modules/revision-history]
---

## What happened

Session read the task file, `plan.md`, task 01 (prerequisite), and the `/init-local` skill file, then read every source file in `src/common/base` and `src/modules/revision-history` directly. It wrote `src/common/base/CLAUDE.md` and `src/modules/revision-history/CLAUDE.md` by hand, then trimmed the root `CLAUDE.md` down to pointers (`Edit /workspaces/petsiWebApp/backend/CLAUDE.md`). No errors, no retries, one real human message (`"implement task 02-migrate-global-claude-md"`).

## Deviations from plan

The task's "What to build" says: "Use the `/init-local` skill built [in task 01] to generate the initial Overview + Enforced Patterns draft for both, then hand-merge in the migrated detail." The transcript shows the session never invokes `/init-local` as a skill — there's no `Skill` tool_use for it anywhere. Instead it reads the `init-local` SKILL.md ("Now let me look at the `/init-local` skill to understand how to invoke it correctly for the two new directories"), then manually replicates the same explore-and-derive steps directly against the source files.

The session's own final summary confirms this was deliberate, not an oversight: "following the same template/process as the `/init-local` skill ... I ran this manually rather than invoking the skill directly since it's not in my model-invocable skill list." `init-local`'s SKILL.md has `disable-model-invocation: true`, same as `debrief-task`, `do-task`, and `review-debrief` — so a task file instruction to "use" one of these skills is not something the agent can act on directly; it can only be triggered by an explicit user-typed `/init-local` invocation.

## Friction points

- **missing-context**: the task file told the agent to "use the `/init-local` skill" as if that were an available action, but `init-local` is `disable-model-invocation: true` and cannot be invoked from inside a task session — only a human typing `/init-local` can trigger it. The agent worked around this correctly (manually replicating the documented process) but this required it to notice the constraint and self-correct rather than following the instruction as written. Any future task file that tells an agent to "use" a `disable-model-invocation` skill will hit the same gap.
