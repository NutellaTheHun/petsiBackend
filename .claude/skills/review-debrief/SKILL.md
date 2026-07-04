---
name: review-debrief
description: Review accumulated debrief files for a PRD (or across PRDs) to find repeat patterns and propose concrete edits to CLAUDE.md, skills, agent config, or allowed-tools. Use when you have a backlog of debriefs and want to improve the workflow itself.
disable-model-invocation: true
---

# Review Debrief

Look across many `debrief` files to find repeat patterns, then propose specific, reviewable edits to the artifacts that actually control agent behavior — CLAUDE.md, skill files, agent/tool configs, allowed-tools lists. This skill never edits anything without showing you the diff first.

## Input

Usage: `/review-debrief [prd-slug]`. If a slug is given, read `prd/<slug>/debriefs/*.md`. If omitted, read every `prd/*/debriefs/*.md` across the repo.

This skill never writes to any file — CLAUDE.md, skill files, settings.json — under any circumstances. It only prints recommendations. Applying one is a separate, explicit instruction the user gives afterward (e.g. "apply finding 2"); there is no dedicated apply-command and no step in this skill that performs the edit.

## Process

1. Read all matching debrief files in full — frontmatter and prose. Tags compress information; the prose under "Friction points" often carries detail that explains _why_ two superficially different tags are actually the same root cause. Note each debrief's `modules-touched` field alongside its tags.

2. Cluster by tag, then look within each cluster for a common cause, not just a common symptom. Three `tool-gap` debriefs that each name a different missing tool are three separate problems; three that all name the same tool are one problem with one clear fix.

3. For each cluster that recurs 2+ times (or once, if clearly severe — e.g. a `blocked` outcome), produce a finding with:
   - **Pattern**: what recurred, and in which debriefs (cite filenames)
   - **Root cause**: best guess at why, grounded in what the debriefs actually say — not speculation
   - **Proposed fix**: a specific, scoped edit. Quote the exact text/diff to add or change, not just a description of it. Examples: add `Bash(npm test:*)` to allowed-tools; add a clarifying paragraph to CLAUDE.md's testing section; amend `do-task` step 3 to require a check before implementing; add a line to the PRD template's Implementation Decisions section.
   - **Target file**: first decide what *kind* of artifact the proposed fix actually belongs to — `modules-touched`-based local/global scoping only applies to the second case below:
     - The fix isn't a CLAUDE.md edit at all (a tool/permission gap → `settings.json`'s allowed-tools; a process fix → a skill file like `do-task`/`debrief-task`; an `ambiguous-instruction` whose fix is really a clearer PRD/task template) → target is that artifact directly. `modules-touched` doesn't apply here.
     - The fix is a codebase fact, convention, or gotcha about how a module behaves (typically `wrong-assumption`, some `missing-context`) → this is a CLAUDE.md edit, so use the union of `modules-touched` across the cluster's debriefs to pick local vs. global: if every debrief in the cluster touched the same single module directory (a `src/modules/<domain>` or one of the four shared-foundation dirs: `src/common/base`, `src/common/exceptions`, `src/common/validation`, `src/infrastructure/database/typeorm`), target that directory's `CLAUDE.md`; if the cluster spans multiple module directories, has empty `modules-touched`, or the finding is inherently cross-cutting, target the root `CLAUDE.md`.
     - If a local target directory doesn't have a `CLAUDE.md` yet, say so in the finding rather than silently falling back to global — that's a signal `/init-local` hasn't been run there yet.

4. Present findings as a numbered list, ordered by frequency/severity, each showing pattern, root cause, proposed fix, and target file. Do not ask whether to apply, skip, or modify — this skill's output ends at the list. If the user wants a finding applied, that's a separate instruction they give afterward, handled outside this skill's process.

5. Do not delete or modify the debrief files themselves — they're the audit trail. If a fix fully resolves a pattern, say so in the summary so a future `review-debrief` run knows it's already addressed, but leave the historical debriefs untouched.

## Notes

- If a debrief's `tools-used` list shows the same tool across nearly every debrief and it still isn't in allowed-tools, that's the single highest-value finding — surface it first.
- If debriefs are mostly tagged `clean`, say so plainly rather than manufacturing findings to fill out the report.
