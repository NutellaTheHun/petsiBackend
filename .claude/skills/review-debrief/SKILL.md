---
name: review-debrief
description: Review accumulated debrief files for a PRD (or across PRDs) to find repeat patterns and propose concrete edits to CLAUDE.md, skills, agent config, or allowed-tools. Use when you have a backlog of debriefs and want to improve the workflow itself.
disable-model-invocation: true
---

# Review Debrief

Look across many `debrief` files to find repeat patterns, then propose specific, reviewable edits to the artifacts that actually control agent behavior — CLAUDE.md, skill files, agent/tool configs, allowed-tools lists. This skill never edits anything without showing you the diff first.

## Input

Usage: `/review-debrief [prd-slug]`. If a slug is given, read `prd/<slug>/debriefs/*.md`. If omitted, read every `prd/*/debriefs/*.md` across the repo.

## Process

1. Read all matching debrief files in full — frontmatter and prose. Tags compress information; the prose under "Friction points" often carries detail that explains _why_ two superficially different tags are actually the same root cause.

2. Cluster by tag, then look within each cluster for a common cause, not just a common symptom. Three `tool-gap` debriefs that each name a different missing tool are three separate problems; three that all name the same tool are one problem with one clear fix.

3. For each cluster that recurs 2+ times (or once, if clearly severe — e.g. a `blocked` outcome), produce a finding with:
   - **Pattern**: what recurred, and in which debriefs (cite filenames)
   - **Root cause**: best guess at why, grounded in what the debriefs actually say — not speculation
   - **Proposed fix**: a specific, scoped edit. Quote the exact text/diff to add or change, not just a description of it. Examples: add `Bash(npm test:*)` to allowed-tools; add a clarifying paragraph to CLAUDE.md's testing section; amend `do-task` step 3 to require a check before implementing; add a line to the PRD template's Implementation Decisions section.

4. Present findings as a numbered list, ordered by frequency/severity. Walk through them one at a time — ask whether to apply, skip, or modify each — rather than batching approval, since these edits touch the user's actual config and skills.

5. For each finding the user approves, make the edit directly (CLAUDE.md, the skill file, settings.json's allowed-tools, etc.) and confirm what changed.

6. Do not delete or modify the debrief files themselves — they're the audit trail. If a fix fully resolves a pattern, say so in the summary so a future `review-debrief` run knows it's already addressed, but leave the historical debriefs untouched.

## Notes

- If a debrief's `tools-used` list shows the same tool across nearly every debrief and it still isn't in allowed-tools, that's the single highest-value finding — surface it first.
- If debriefs are mostly tagged `clean`, say so plainly rather than manufacturing findings to fill out the report.
