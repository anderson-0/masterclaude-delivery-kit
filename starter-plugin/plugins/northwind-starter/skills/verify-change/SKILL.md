---
name: verify-change
description: Check a change before it is handed to a human reviewer. Use before saying a task is done, before opening a PR, or when asked to verify work.
---

# Verify a change

Run these in order and report each result. Do not say the work is done if any step fails.

1. **Scope:** `git diff --stat` against the base branch. Every changed file must belong to the task. Explain or revert anything else.
2. **Tests:** run the project's test command (see CLAUDE.md). All tests pass; skipped tests are listed with their reason.
3. **Static checks:** run the project's lint and type-check commands if they exist.
4. **Secrets:** confirm no `.env` file, key, token or credential appears in the diff.
5. **Size:** if the diff is over 400 changed lines, propose a split. Large PRs wait longest for review.
6. **Summary for the reviewer:** what changed, why, how it was verified, and what the reviewer should look at first.
