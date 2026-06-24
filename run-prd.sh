#!/usr/bin/env bash
# Usage: ./run-prd.sh <prd-slug> [max-iterations]
#
# Repeatedly invokes a FRESH, non-interactive Claude Code process for each
# task in prd/<prd-slug>/tasks/, stopping when all tasks are done, none are
# eligible (all blocked), or max-iterations is hit (default 50, as a safety
# valve against an infinite loop if something never resolves to "done").

set -euo pipefail

PRD_SLUG="${1:?Usage: ./run-prd.sh <prd-slug> [max-iterations]}"
MAX_ITERS="${2:-50}"
TASKS_DIR="prd/${PRD_SLUG}/tasks"

if [ ! -d "$TASKS_DIR" ]; then
  echo "No such tasks folder: $TASKS_DIR"
  exit 1
fi

for i in $(seq 1 "$MAX_ITERS"); do
  # status: done / status: todo / status: in-progress are on their own
  # frontmatter line in each task file.
  not_done=$(grep -rL '^status: done' "$TASKS_DIR"/*.md 2>/dev/null || true)

  if [ -z "$not_done" ]; then
    echo "✅ All tasks in ${PRD_SLUG} are done. ($((i - 1)) iteration(s) ran)"
    exit 0
  fi

  echo ""
  echo "=== Iteration $i — launching fresh agent for ${PRD_SLUG} ==="
  echo "Remaining (not done):"
  echo "$not_done" | sed 's/^/  - /'
  echo ""

  # -p / --print: non-interactive, one-shot, exits when finished — this is
  # what gives each task a genuinely fresh context, since it's a new process.
  # acceptEdits lets it write files/run tests without an interactive prompt;
  # swap for --dangerously-skip-permissions only if you trust the repo fully.
  claude -p "/do-task ${PRD_SLUG}" --permission-mode acceptEdits

  echo "--- iteration $i finished ---"
done

echo "⚠️  Hit max iterations (${MAX_ITERS}) without finishing all tasks."
echo "Check ${TASKS_DIR} for tasks stuck in-progress or blocked."
exit 1