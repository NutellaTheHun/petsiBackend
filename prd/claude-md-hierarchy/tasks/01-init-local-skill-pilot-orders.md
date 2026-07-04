status: todo
blocked-by: []

---

## Source

`prd/claude-md-hierarchy/plan.md`

## What to build

A new skill, `.claude/skills/init-local/SKILL.md`, that generates or regenerates a directory-local `CLAUDE.md` from a fixed 3-section template. Invocation is `/init-local <path>` — one directory per run, arg required, no bulk/`--all` mode.

The skill explores the given directory (entities, services, controllers, validators, tests) and derives:

- **Overview** — what this directory does, key entities/relationships.
- **Enforced Patterns** — rules that must be followed here, and why.

It does **not** write a Gotchas section — that section is populated only by explicitly applying a `review-debrief` recommendation (a later task), never by `/init-local`. When run against a directory that has no local `CLAUDE.md` yet, the skill creates one with an empty `## Gotchas` heading and no entries.

Re-running the skill against a directory that already has a local `CLAUDE.md` re-derives Overview and Enforced Patterns fresh from the current state of the code, shows the user a diff against the existing file, and asks for confirmation before overwriting. The existing Gotchas section is always preserved verbatim across a re-run — never regenerated, never diffed away.

File template (frontmatter + sections):

```
---
module: <path>
last_reviewed: <date>
---

## Overview
<what this directory does, key entities/relationships>

## Enforced Patterns
<rules that must be followed here, and why>

## Gotchas
<date> — <what went wrong> — <the correction now in force>
```

**Pilot**: run the new skill on `src/modules/orders` and validate the generated `src/modules/orders/CLAUDE.md` reads correctly — accurate Overview, patterns that actually hold in that module's code (nested entities, recurrence scheduling, revision-history integration), and no invented Gotchas entries.

## Acceptance criteria

- [ ] `.claude/skills/init-local/SKILL.md` exists, invocable as `/init-local <path>`, and errors or prompts if no path arg is given
- [ ] Running it against a directory with no existing `CLAUDE.md` creates one matching the template, with an empty Gotchas section
- [ ] Running it a second time against the same directory re-derives Overview + Enforced Patterns, shows a diff, and requires confirmation before overwriting
- [ ] A pre-existing Gotchas section survives a re-run untouched
- [ ] `src/modules/orders/CLAUDE.md` is generated via the new skill and manually reviewed for accuracy
