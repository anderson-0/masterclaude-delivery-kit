---
name: test-backfill
description: Add unit tests to an existing, untested module without changing its behavior. Use when asked to backfill, add or improve tests for existing code, or when a PR is labeled test-backfill.
---

# Test backfill

Goal: pin down what the code does today. You are not fixing it.

1. Read the module and its callers. List the behaviors worth pinning: the happy path, edge cases visible in the code, and every branch that handles money, dates or permissions.
2. Find the existing test conventions in this repo (runner, file location, naming, fixtures) and follow them. Do not add a test framework or a dependency.
3. Write the tests. Assert on behavior through the public interface, not on private helpers.
4. Run the tests. If a test fails because the code looks wrong, do **not** change the code. Mark the test as skipped with a comment that starts with `BUG?` and describes the suspected defect, so a human decides.
5. Never edit non-test files in a test-backfill change.
6. Finish with the `verify-change` skill, then summarize: behaviors covered, suspected bugs found, anything you could not test and why.

The PR gets the `test-backfill` label. That label is how the pilot counts this work, so it must only go on test-only changes.
