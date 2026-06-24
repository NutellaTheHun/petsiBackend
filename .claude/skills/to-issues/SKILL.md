---
name: to-issues
description: Break a plan, spec, or PRD into independently-completable local task files using tracer-bullet vertical slices.
disable-model-invocation: true
---

# To Issues

Break a plan into independently-completable task files using vertical slices (tracer bullets), so individual agents can pick up small, self-contained pieces of work.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a path to a PRD or plan file, read it in full.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Task titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the plan into **tracer bullet** tasks. Each task is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Any prefactoring should be done first
</vertical-slice-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories this addresses (if the source material has them)

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?

Iterate until the user approves the breakdown.

### 5. Write the task files locally

Determine the slug for the source PRD (e.g. from its filename, or derive one from the plan's title if there's no PRD file). Write each approved slice to `prd/<prd-slug>/tasks/<NN>-<slice-slug>.md`, creating the folder if needed.

Number files in dependency order — blockers get lower numbers — so the folder reads top-to-bottom as a rough build order.

Use the task template below. Reference other slices by their filename (e.g. `01-add-schema.md`) in the `blocked-by` field rather than an issue number.

## <task-template>

status: todo
blocked-by: []

---

## Source

A reference to the PRD or plan file this task was broken out from, if applicable.

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

Avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it here and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

</task-template>

When an agent completes a task, it should update that file's `status` field to `done` rather than deleting it.

Do NOT modify the source PRD file.
