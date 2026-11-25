# Client brief: Northwind Field Services

*Fictional company, built for this course. Any resemblance to a real company is accidental.*

## The company
Northwind sells field-service software: dispatchers schedule technician visits, technicians close jobs from a mobile app, and billing invoices the customer. About 600 employees, 40 developers in five teams of eight: **dispatch**, **billing**, **mobile**, **platform**, **integrations**.

MeetingMemo, the practice app from earlier courses, is Northwind's internal tool for site meetings and action items. The dispatch team owns it. When a lab needs a real codebase, it uses `meetingmemo/` as Northwind's repo.

## Why they called you
The CTO bought Claude Team seats for a handful of engineers six months ago. Usage faded after three weeks, and nobody can say what it changed. The board now asks every department for an "AI plan" with numbers. The CTO wants one engineering result that holds up in front of the CFO before rolling out to all 40 developers.

> "I don't need a revolution. I need one result I can defend, and a way to get the next ten." — Dana Whitfield, CTO

## What they have already
- GitHub for code and pull requests. Every team uses labels; billing and dispatch label test work `test-backfill`.
- CI on every PR. Billing has the weakest test suite in the company; dispatch is close behind.
- Claude Team seats (6, mostly unused). No managed settings, no shared CLAUDE.md, no plugins.
- A security team of two that has not reviewed Claude Code yet.

## Constraints
- Pilot budget approved by finance: **up to $3,000 of usage** on top of existing seats for 30 days.
- Security must sign off before anyone in the cohort installs anything.
- No customer data in prompts. Production database credentials exist on some laptops.
- Q2 planning starts in mid-April. The readout must happen before then.

## Key dates (2026)
| Date | Event |
|---|---|
| Feb 2–6 | Discovery interviews |
| Jan 12 – Feb 23 | Baseline window (six weeks of merged PRs) |
| Feb 23 – Mar 1 | Pre-kickoff week: security sign-off, installs, champion briefing |
| Mar 2 | Day 1 of the pilot |
| Apr 1 | Day 30 |
| Apr 3 | Readout to CTO, VP Engineering and finance |

## Files in this folder
| File | What it is |
|---|---|
| `stakeholder-notes.md` | Notes from the discovery interviews |
| `backlog.csv` | Candidate work items gathered in discovery |
| `roster.csv` | The 40 developers: team, seniority, whether they volunteered |
| `prs-before-pilot.json` | `gh pr list` export taken in the pre-kickoff week |
| `cohort.txt`, `comparison.txt` | The pilot cohort and comparison group (decided in the pilot-design lesson) |
| `prs-day30.json` | `gh pr list` export taken on Day 30 (includes the baseline period) |
| `usage-day30.csv` | Daily Claude Code usage for the cohort during the pilot |
| `survey-baseline.csv`, `survey-day30.csv` | Developer-experience survey, cohort only, 1–5 scale |
