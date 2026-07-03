---
name: debrief
description: Capture what happened during a just-completed /do-task session — friction, deviations, tool gaps — to a structured debrief file. Use immediately after a task is done, in the same conversation. No analysis or fixing, just capture.
disable-model-invocation: true
---

# Debrief

Capture what actually happened during the task you just completed, while it's still in context. This is capture only — do not propose or make any fixes here. That's `review-debrief`'s job, once enough debriefs have accumulated.

## When to run

Run this in the same conversation right after a `/do-task` session reaches `done`, `done-with-deviations`, or gets stuck/blocked. If the task isn't finished, still capture what happened before stopping.

## Process

1. Identify the task file just worked on (e.g. `prd/<slug>/tasks/<NN>-<slice>.md`). If ambiguous, ask which task this debrief is for.

2. Reconstruct from the conversation itself, not from general impressions:
   - Did the implementation match "What to build" as written, or did something get reinterpreted or clarified along the way?
   - Were any acceptance criteria left unchecked, or checked only after a deviation from the original plan?
   - Where did the agent get stuck, retry, backtrack, or need a manual correction from the user?
   - Were any tools needed that weren't in the allowed-tools list, requiring approval mid-task?
   - Were any tools available but reached for repeatedly without success (wrong tool offered for the job)?
   - Was anything in the PRD's Implementation Decisions or Testing Decisions ambiguous, or contradicted by what the codebase actually looked like?

3. Tag the debrief using only tags from this fixed vocabulary. Extend this list over time in this skill file itself — don't invent one-off tags per debrief, or pattern-matching across debriefs later won't work.
   - `tool-gap` — needed a tool not in allowed-tools
   - `ambiguous-instruction` — PRD/task wording allowed multiple readings
   - `wrong-assumption` — codebase didn't match what the PRD assumed
   - `test-flakiness` — tests failed for reasons unrelated to the change
   - `scope-creep` — task pulled in work beyond its slice
   - `missing-context` — task file didn't carry enough to avoid re-deriving prior decisions
   - `manual-correction` — user had to step in to redirect the agent
   - `clean` — no issues, went as planned

4. Write the debrief to `prd/<slug>/debriefs/<task-slug>.md` (create the folder if needed), using the template below. Don't ask for confirmation before writing — this is a low-stakes capture step, not a deliverable.

## <debrief-template>

```
---
task: prd/<slug>/tasks/<NN>-<slice>.md
date: <YYYY-MM-DD>
outcome: done | done-with-deviations | blocked
tags: [tag1, tag2]
tools-used: [tool1, tool2]
tools-requested-but-missing: [tool3]
---

## What happened

Brief, factual account of the session — what was built, in what order, any retries.

## Deviations from plan

Specific differences between the task file's "What to build" / acceptance criteria and what was actually implemented or decided. Cite the exact decision that changed if possible.

## Friction points

Concrete moments of friction: errors, ambiguity, missing context, manual corrections. Tie each one to a tag above.
```

</debrief-template>

Keep it short — a debrief should take one read to absorb, not become a second PRD.
