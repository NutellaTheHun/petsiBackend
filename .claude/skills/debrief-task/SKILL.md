---
name: debrief
description: Capture what happened during a completed /do-task session — friction, deviations, tool gaps — by reconstructing it from the session's transcript on disk. Runs in a fresh context with zero shared conversation memory; use right after a task finishes (typically as a background Agent spawned by do-task) or manually against a past task's recorded session id.
disable-model-invocation: true
---

# Debrief

Capture what actually happened during a task, reconstructed entirely from that session's transcript on disk. This is capture only — do not propose or make any fixes here. That's `review-debrief`'s job, once enough debriefs have accumulated.

This skill assumes **zero shared context** with the session it's debriefing. It is typically invoked as a background Agent spawned by `do-task` right after that task finishes, which by construction starts cold. Do not rely on anything you "remember" about the task — every claim in the debrief must trace back to the task file or the transcript.

## When to run

- Manually: `/debrief-task <prd-slug> <task-number-or-filename>`.
- Automatically: spawned as a background Agent by `do-task`'s last step, once that's wired up.

## Process

### 1. Locate the task file and its session id

- Resolve `prd/<prd-slug>/tasks/<task>.md` (accept a task number or filename, same matching convention as `do-task`).
- Read its frontmatter for a `session:` field.
- If it's missing, stop and report that plainly — the task file has no recorded session id (it may predate `do-task`'s session-recording step, or wasn't run via `/do-task`). Do not fall back to conversation memory or guess a session id.

### 2. Locate the transcript

- Path: `~/.claude/projects/<project-hash>/<session-id>.jsonl`, where `<project-hash>` is the current working directory with every `/` replaced by `-` (e.g. `/workspaces/petsiWebApp/backend` → `-workspaces-petsiWebApp-backend`).
- If the file doesn't exist at that path, stop and report it — don't substitute conversation memory or another session's transcript.

### 3. Parse the transcript

Don't read the raw JSONL as text — transcripts run to tens of thousands of lines. Use a short Bash/Node script to extract structured signal. Each line is one JSON record; the relevant `type`s:

- `assistant` — `message.content` is an array of blocks:
  - `tool_use` — `{ name, input }`. For `Edit`/`Write`, `input.file_path` is the target. For `Bash`, `input.command`.
  - `text` — assistant-authored explanation shown to the user (reasoning about a course correction, a caveat, a flagged ambiguity).
  - `thinking` — internal only; not worth quoting in the debrief.
- `user` — either:
  - `message.content` is a **string** — a real message typed into the session. The first one is normally the task-selection prompt (e.g. "implement task NN-slug"); any later ones are genuine mid-session interjections.
  - `message.content` is an **array** of `tool_result` blocks — `{ tool_use_id, content, is_error }`, matched back to the `tool_use` with the same id.

Watch for local-command noise: strings wrapped in `<local-command-caveat>` tags, or `<command-name>/clear</command-name>` etc., are slash-command artifacts, not human interjections — exclude them from "manual correction" evidence.

Extract, in order: every human string message (minus local-command noise), every `tool_use` (name + input), and every `tool_result` with `is_error: true` paired with the `tool_use` it answers.

From that, derive two frontmatter fields directly:
- `tools-used` — the deduped set of every `tool_use.name` seen in the session.
- `tools-requested-but-missing` — scan `tool_result` blocks with `is_error: true` for permission-denial phrasing: `"requires approval"`, or `"Claude requested permissions to use <tool>, but you haven't granted it yet."` Extract the tool name from the matched message (from the paired `tool_use.name`, or from `<tool>` in the message text) into this list. This is what lets `review-debrief` spot a tool that keeps getting requested but never added to allowed-tools.

### 4. Reconstruct friction and deviations from that evidence

Every debrief claim must cite the transcript evidence behind it (a tool name + input, a quoted error, a quoted human message) — this is what makes the debrief usable from a fresh context. Map evidence to signal:

- A `tool_result` with `is_error: true` → a concrete friction point. Note what was retried afterward, if anything.
- A repeated `tool_use` of the same tool against the same target following an error → retry/backtrack.
- Any human string message beyond the first (excluding local-command noise) → a manual correction; quote it.
- An assistant `text` block that reverses or qualifies a prior step ("actually...", "that didn't work, trying...") → supporting color for a friction point, not a source on its own.
- Compare the sequence of `Edit`/`Write` targets and the task's acceptance criteria against what actually got built, to spot scope or plan deviations.
- If none of the above turn up anything, and the tool sequence matches what the task file describes, tag the debrief `clean`.

Then tag using the fixed vocabulary below (extend it here over time — don't invent one-off tags per debrief):
- `tool-gap` — needed a tool not in allowed-tools (a `tool_result` error naming a missing tool/permission)
- `ambiguous-instruction` — PRD/task wording allowed multiple readings
- `wrong-assumption` — codebase didn't match what the PRD assumed
- `test-flakiness` — tests failed for reasons unrelated to the change
- `scope-creep` — task pulled in work beyond its slice
- `missing-context` — task file didn't carry enough to avoid re-deriving prior decisions
- `manual-correction` — a genuine mid-session human message redirected the agent
- `clean` — no issues, went as planned

### 5. Derive modules touched

From every `Edit`/`Write` tool_use's `file_path`, keep only paths under `src/`. Record, per path, the containing directory: `src/modules/<domain>` for anything under `src/modules/`, or the specific shared-foundation directory (`src/common/base`, `src/common/exceptions`, `src/common/validation`, `src/infrastructure/database/typeorm`) if it falls under one of those. Dedupe. Paths outside `src/` (skills, prd files, docs) are not modules — exclude them.

### 6. Write the debrief

Write to `prd/<slug>/debriefs/<task-slug>.md` (create the folder if needed), using the template below. Don't ask for confirmation before writing — this is a low-stakes capture step, not a deliverable.

## <debrief-template>

```
---
task: prd/<slug>/tasks/<NN>-<slice>.md
date: <YYYY-MM-DD>
outcome: done | done-with-deviations | blocked
tags: [tag1, tag2]
tools-used: [tool1, tool2]
tools-requested-but-missing: [tool3]
modules-touched: [src/modules/orders, src/common/base]
---

## What happened

Brief, factual account of the session — what was built, in what order, any retries. Cite transcript evidence (tool + target, quoted error/message) for anything non-obvious.

## Deviations from plan

Specific differences between the task file's "What to build" / acceptance criteria and what was actually implemented or decided, per the Edit/Write sequence and any human messages. Cite the exact decision that changed if possible.

## Friction points

Concrete moments of friction: errors, ambiguity, missing context, manual corrections — each backed by the transcript evidence found in step 4. Tie each one to a tag above.
```

</debrief-template>

Keep it short — a debrief should take one read to absorb, not become a second PRD.
