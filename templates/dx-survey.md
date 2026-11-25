# Developer-experience survey (cohort, 1–5 scale)

Run it in the pre-kickoff week and again on Day 30, with the same questions and the same people. Keep it under two minutes.

1. I can finish a typical task without waiting on others.
2. I trust the code that reaches review.
3. Reviewing PRs takes a reasonable share of my week.
4. I know which tasks Claude Code is good for.
5. I would recommend our current dev setup.

Export to CSV with the questions as the header row, one row per answer sheet, then run `node delivery-kit/scripts/delivery-metrics.mjs survey <file>.csv`.
