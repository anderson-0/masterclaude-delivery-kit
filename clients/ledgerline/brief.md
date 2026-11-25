# Client brief: Ledgerline Payments (capstone)

*Fictional company, built for this course. Any resemblance to a real company is accidental.*

## The company
Ledgerline runs B2B payments and reconciliation for mid-size European companies. About 900 employees, 120 developers in six teams of 20: **payments-core**, **ledger**, **risk**, **onboarding**, **platform**, **mobile**. It is regulated: payments-core is in PCI DSS scope, and the whole company is audited for SOC 2 every year.

## Why they called you
The CIO has to show the board a plan for AI-assisted engineering in 45 days. The ledger team is stuck on a migration: the ledger service still runs on Java 8 and an old framework version, and every migrated module goes through a two-reviewer rule and a change advisory board (CAB). The CIO thinks Claude Code could help there, but security has already said "not on the public API".

## What they have already
- GitHub Enterprise; every PR needs two approvals (enforced by branch protection).
- An AWS organization with Amazon Bedrock enabled in their EU region. **All LLM traffic must stay in their AWS account.** No direct Anthropic API, no claude.ai seats.
- A central platform team that owns developer laptops through MDM.
- A change advisory board that meets weekly and approves any tooling that touches production code.
- PR labels: the ledger team labels migration work `legacy-migration`.

## Constraints
- Bedrock only, in their account. The capstone is a plan: you write the configuration, you do not need a working Bedrock setup.
- No prompts or code may be logged outside the company by default.
- Developers must not be able to switch guardrails off themselves.
- Two approvals per PR stay mandatory. Nobody merges without review, ever.
- Budget: the CIO will approve a pilot only with a cost estimate per developer and a hard cap.

## Your deliverable
A **Delivery Plan Pack** for a 30-day pilot, using the templates in `delivery-kit/templates/` and the data in this folder.

## Files in this folder
| File | What it is |
|---|---|
| `stakeholder-notes.md` | Notes from the discovery interviews |
| `backlog.csv` | Candidate work items gathered in discovery |
| `roster.csv` | The 120 developers: team, seniority, whether they volunteered |
| `prs-before-pilot.json` | `gh pr list` export of merged PRs, Aug 31 – Oct 12, 2026 |
