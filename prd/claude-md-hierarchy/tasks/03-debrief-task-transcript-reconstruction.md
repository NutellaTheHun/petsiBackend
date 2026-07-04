status: todo
blocked-by: []

---

## Source

`prd/claude-md-hierarchy/plan.md`

## What to build

Update `.claude/skills/debrief-task/SKILL.md` so it can run in a completely fresh context with zero shared conversation memory, reconstructing what happened in a task purely from disk state.

**Transcript-based reconstruction:** instead of relying on conversation memory (which assumes the debrief runs in the same context that did the implementation), `debrief-task` now:
1. Reads the task file (`prd/<slug>/tasks/<task>.md`) to get its `session` frontmatter field (a `$CLAUDE_CODE_SESSION_ID`).
2. Locates the matching transcript at `~/.claude/projects/<project-hash>/<session-id>.jsonl`.
3. Parses that JSONL to reconstruct friction points and deviations from the original plan — what was tried, what failed, what the agent corrected course on — instead of pulling this from context it doesn't have.

**New `modules touched` field:** `debrief-task` also parses the transcript's Edit/Write tool calls to determine which directories under `src/` were modified, and records this as a new field in the debrief's frontmatter/template (e.g. `modules-touched: [src/modules/orders, src/common/base]`). This lets a later consumer (`review-debrief`) know which local `CLAUDE.md` file(s) are candidates for a given finding.

This task does not change `do-task` (that's task 04) or `review-debrief` (that's task 05) — it only changes how `debrief-task` itself sources its input and what it records. It can be built and tested against an existing task's session id without either of those other two changes existing yet.

## Acceptance criteria

- [ ] `debrief-task` reads `session` from the target task file's frontmatter rather than assuming shared conversation context
- [ ] `debrief-task` locates and parses the correct `.jsonl` transcript file for that session id
- [ ] Friction/deviation reconstruction is derived from transcript content (tool calls, errors, corrections), not from anything only visible in live conversation memory
- [ ] The debrief output includes a `modules touched` field listing directories under `src/` that were edited during the session, derived from Edit/Write tool calls in the transcript
- [ ] Manually run `/debrief-task` against a past task with a known session id (e.g. one of the `atomic-test-refactor` tasks, if a session id can be backfilled or a fresh test task is used) and confirm the output is accurate and self-consistent with no shared-context assumptions
