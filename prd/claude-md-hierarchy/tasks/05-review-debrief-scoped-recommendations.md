status: done
blocked-by: [03-debrief-task-transcript-reconstruction.md]
session: 896d99f8-9f98-42f6-b179-2e10c3fd9b10

---

## Source

`prd/claude-md-hierarchy/plan.md`

## What to build

Update `.claude/skills/review-debrief/SKILL.md` so it clusters accumulated debriefs and proposes CLAUDE.md edits scoped to the right file, local or global — and so it never writes anything itself.

**Prerequisite:** `03-debrief-task-transcript-reconstruction.md` must be complete — `review-debrief` reads the `modules touched` field that task adds to each debrief's frontmatter.

**Changes:**
1. When clustering debrief findings, use each debrief's `modules touched` field to determine which local `CLAUDE.md` file(s) (under `src/modules/<domain>/` or one of the 4 shared-foundation dirs) are candidates for a given finding, versus the root/global `CLAUDE.md` for cross-cutting findings.
2. Present findings as numbered recommendations, each showing: the pattern observed, the root cause, the exact proposed text, and which file (local or global) it would go into.
3. Remove the existing auto-apply behavior (step 5 in the current `review-debrief` SKILL.md) entirely. `review-debrief` only prints recommendations now — it never writes to any CLAUDE.md itself. Applying a recommendation is a separate, explicit instruction from the user afterward (e.g. "apply finding 2"); there is no dedicated apply-command for this.

## Acceptance criteria

- [x] `review-debrief` reads `modules touched` from each debrief and uses it to scope proposed findings to the correct local `CLAUDE.md` file, falling back to global for cross-cutting findings
- [x] Each printed recommendation includes: pattern, root cause, exact proposed text, and target file
- [x] The auto-apply step is removed from `review-debrief`'s SKILL.md — running it does not modify any file
- [x] Manually run `/review-debrief` against a small set of real or test debriefs (e.g. produced by task 03/04's test runs) and confirm recommendations are correctly scoped and nothing is written to disk
