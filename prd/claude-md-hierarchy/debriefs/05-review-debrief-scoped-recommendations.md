---
task: prd/claude-md-hierarchy/tasks/05-review-debrief-scoped-recommendations.md
date: 2026-07-04
outcome: done-with-deviations
tags: [tool-gap, manual-correction]
tools-used: [Bash, Read, Edit, AskUserQuestion, Skill, Write, Agent]
tools-requested-but-missing: []
modules-touched: []
---

## What happened

This session's outer thread was task 04 (`do-task-session-handoff`), kicked off by the human message "please implement 04-do-task-session-handoff". The assistant edited `.claude/skills/do-task/SKILL.md` step 5 to record `session: $CLAUDE_CODE_SESSION_ID` and spawn a background debrief Agent on completion (`toolu_016JDvAsxA5sza1k9miLqwKu`).

Before marking task 04 done, its own acceptance criteria required a live end-to-end run of `do-task` to validate the new mechanism. The assistant used `AskUserQuestion` to ask how to validate; the human picked "Run /do-task on task 05 (Recommended)" — task 05 (this task) was the vehicle chosen for that validation.

The assistant first tried `Skill({skill:"do-task", args:"claude-md-hierarchy 05"})`, which errored: `"<tool_use_error>Skill do-task cannot be used with Skill tool due to disable-model-invocation</tool_use_error>"`. The human then sent `[Request interrupted by user]`, and the actual invocation happened via the real `/do-task 05-review-debrief-scoped-recommendations` slash command instead.

From there, `do-task`'s own process took over: task 05 set to `status: in-progress`; loaded the task file, `review-debrief/SKILL.md`, and the one existing real debrief (`02-migrate-global-claude-md.md`) as minimal context. The assistant then made one combined edit to `review-debrief/SKILL.md` (`toolu_01VHdvTQYc9WgGK89qePDF1r`) implementing all three requested changes: `modules-touched`-based local/global CLAUDE.md scoping, the "pattern / root cause / proposed fix / target file" finding shape, and removal of the auto-apply step (replacing step 5's ask-per-finding language and the old step 6).

To satisfy acceptance criterion 4 ("manually run `/review-debrief` against a small set of real or test debriefs"), the assistant wrote 6 synthetic debrief fixtures to the scratchpad (`test-a-orders-1/2`, `test-c-crosscutting-1/2`, `test-e-orders-gotcha-1/2`) covering a single-module cluster, a cross-cutting/multi-module cluster, and a `wrong-assumption` cluster, and dry-ran the new logic against those plus the one real debrief. Two rounds of gaps surfaced during that dry run and were fixed in place (see Deviations). After the logic settled, the assistant confirmed via `md5sum` on `CLAUDE.md` files (identical before/after: `29b2fe0...`, `45784ff...`), `find -newer` on the debriefs folder (unchanged), and `git status --short` (only `do-task/SKILL.md`, `review-debrief/SKILL.md`, and the task 05 file touched) that nothing else was written. The synthetic fixtures were deleted (`rm -rf .../test-debriefs`). Task 05 was then marked `status: done` with `session: 896d99f8-9f98-42f6-b179-2e10c3fd9b10` and all 4 acceptance criteria checked, and a background Agent was spawned to debrief it (`toolu_01DZGHbjCnFGEDJsbkhnJuoY` — this debrief).

## Deviations from plan

- **Invocation mechanism**: the task's own selection/validation was meant to go through `do-task` normally, but the first attempt via the `Skill` tool failed outright (`disable-model-invocation` blocks Skill-tool invocation of `do-task`), forcing a human interrupt and a switch to the real `/do-task` slash command. Not a scope change, but a mechanical detour not implied by the task file.
- **Target-file logic landed in 3 edits, not 1, and grew beyond the task's literal 3 bullets.** The first edit combined all three requested changes into step 3 (scoping) and steps 4–5 (finding shape, no auto-apply). The dry run against the synthetic fixtures then surfaced two real gaps neither the task file nor the first draft anticipated:
  - Assistant text: *"My dry run surfaced a real gap: the local/global CLAUDE.md scoping logic I wrote doesn't distinguish CLAUDE.md-targeted findings from findings whose fix is actually a settings.json or skill-file edit (e.g. a `tool-gap` cluster...)."* → fixed via `toolu_018o6H8Nj2EtZaaTikVSKm9B`, splitting "target file" into two kinds of fix (non-CLAUDE.md artifact vs. CLAUDE.md-via-modules-touched). This edit also exposed a stale-numbering bug (old steps 5/6 needed to become 4/5), fixed in `toolu_01CWwQj8YqpNWXYdMG7Byxn9`.
  - Assistant text: *"The dry run surfaced another gap: `ambiguous-instruction` findings (whose fix is often a PRD/task-template edit, not a CLAUDE.md or settings.json change) don't fit either of my two buckets. Let me generalize the rule."* → fixed via `toolu_01NqaxTcoWgeHEDCpc74tuEf`, generalizing the non-CLAUDE.md bucket to cover tool-gap→settings.json, process-fix→skill file, **and** ambiguous-instruction→PRD/task template (the third case is not named anywhere in the task's "Changes" list).
- **Test-fixture method**: acceptance criterion 4 said "real or test debriefs" without specifying how; the assistant chose to hand-author 6 synthetic fixtures in the scratchpad (outside the repo's real `debriefs/` folder) rather than reuse only real ones, then deleted them post-validation.

## Friction points

- **tool-gap** — `Skill({skill:"do-task", args:"claude-md-hierarchy 05"})` errored: `"Skill do-task cannot be used with Skill tool due to disable-model-invocation"`. `do-task/SKILL.md` (like `debrief-task/SKILL.md`) carries `disable-model-invocation: true`, which blocks invocation via the Agent's own `Skill` tool — only the real slash command works. This didn't match the `tools-requested-but-missing` evidence pattern (no "requires approval" / permission-grant phrasing), so it isn't listed in that frontmatter field, but it's a structural gap worth flagging since any `disable-model-invocation` skill will hit it the same way if an agent tries to self-invoke it.
- **manual-correction** — immediately after that error, the human sent `[Request interrupted by user]` with no further text; the next turn is the real `/do-task 05-review-debrief-scoped-recommendations` slash-command invocation, i.e. the correction was to switch invocation paths rather than debug the Skill-tool error.
