status: todo
blocked-by: [03-debrief-task-transcript-reconstruction.md]

---

## Source

`prd/claude-md-hierarchy/plan.md`

## What to build

Update `.claude/skills/do-task/SKILL.md` so that finishing a task automatically kicks off a debrief in a fresh background context, instead of the debrief loop existing only on paper.

**Prerequisite:** `03-debrief-task-transcript-reconstruction.md` must be complete — `do-task` is spawning the *updated* `debrief-task`, which now expects to find a `session` field on the task file and reconstructs from the transcript rather than shared memory.

**Changes to `do-task`'s existing "resolve and report" final step:**
1. Record `session: $CLAUDE_CODE_SESSION_ID` into the task file's frontmatter (alongside the existing `status` field).
2. Spawn a background Agent running `/debrief-task <prd-slug> <task>` for the task just completed.

This is a small, targeted addition to the end of `do-task`'s existing flow — it does not change how `do-task` picks up, plans, or implements a task, only what happens after a task is marked done. The spawned agent's tool needs are minimal (Read/Bash/Write) and low-risk, per the plan's explicit scoping — this is not the earlier headless-loop idea for running all of `do-task` unattended.

## Acceptance criteria

- [ ] `do-task`'s final step writes `session: $CLAUDE_CODE_SESSION_ID` into the task file's frontmatter before/alongside marking `status: done`
- [ ] `do-task`'s final step spawns a background Agent invoking `/debrief-task <prd-slug> <task>` for the completed task
- [ ] `do-task`'s planning/implementation flow prior to the final step is unchanged
- [ ] Run `do-task` end-to-end on a real (small) task and confirm the task file ends up with both `status: done` and a `session` field, and that a debrief agent was spawned and produced output
