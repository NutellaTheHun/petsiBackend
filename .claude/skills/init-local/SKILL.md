---
name: init-local
description: Generate or regenerate a directory-local CLAUDE.md (Overview + Enforced Patterns) by exploring that directory's code. Never touches an existing Gotchas section. Usage- /init-local <path>
disable-model-invocation: true
---

# Init Local

Generate or refresh a directory-local `CLAUDE.md` from a fixed 3-section template, by actually reading the directory's code rather than guessing. This skill writes Overview and Enforced Patterns only — it never writes Gotchas content.

## Input

Usage: `/init-local <path>`, e.g. `/init-local src/modules/orders`.

`<path>` is required and this skill handles exactly one directory per run — there is no bulk/`--all` mode. If no path is given, ask the user which directory to target rather than guessing or defaulting to the whole repo.

If `<path>` doesn't exist, say so and stop.

## Process

### 1. Explore the directory

Read what's actually there — entities, services, controllers, validators, builders, DTOs, the `*.module.ts` wiring file, and a representative sample of specs. Don't just skim filenames; read enough of each to ground the sections below in real code.

### 2. Derive Overview and Enforced Patterns

- **Overview** — what this directory/module does, the key entities and how they relate to each other (and to entities in other modules, if the relationship is central to understanding this one).
- **Enforced Patterns** — rules that must be followed here, and *why*. Look for things enforced by validators, base-class overrides, lifecycle hook usage, non-obvious builder/composer wiring, or domain-specific constraints a newcomer would get wrong. Ground every claim in code you actually read. Do not invent a pattern that isn't actually enforced somewhere in this directory.

Do not derive or write anything for Gotchas — that section is populated only by explicitly applying a `review-debrief` recommendation, never by this skill.

### 3. Check for an existing `<path>/CLAUDE.md`

**No existing file:**

Write a new file using the template below: derived Overview and Enforced Patterns, `module: <path>` and `last_reviewed: <today's date>` in frontmatter, and an empty `## Gotchas` heading with no entries underneath.

**File already exists:**

- Re-derive Overview and Enforced Patterns fresh from the current state of the code — treat step 2 as a clean re-derivation, not an edit of the old text, so stale claims don't survive by inertia.
- Copy the existing `## Gotchas` section verbatim — byte-for-byte, unread and untouched by the regeneration. It is never part of the diff or the confirmation.
- Show the user a diff of old vs. new frontmatter + Overview + Enforced Patterns only.
- Ask for confirmation before overwriting. If the user declines, leave the file untouched.
- On confirmation, write the file with the new frontmatter/Overview/Enforced Patterns and the untouched Gotchas section appended exactly as it was.

## Template

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

A newly created file's Gotchas section is the heading only — no entries, not even a placeholder line.

## Notes

- This skill only ever touches one file: `<path>/CLAUDE.md`. It never edits the global `CLAUDE.md` or any other directory's local file.
- Never write to Gotchas, under any circumstance, on either a fresh write or a re-run.
