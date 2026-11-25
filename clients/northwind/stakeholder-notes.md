# Discovery notes: Northwind (Feb 2–6, 2026)

## Dana Whitfield, CTO (sponsor)
- Wants one defensible result in 30 days, then a plan for the other 32 developers.
- Burned by the first seat purchase: "we bought it, nobody measured anything."
- Will present to the CFO. Asked for "a number, and how sure we are about it."

## Marcus Lee, VP Engineering
- Wants to show "velocity". Suggested measuring "% of code written by AI".
- Worried that review load is already the bottleneck in billing.
- Open to a comparison group "if it does not slow the other teams down".

## Priya Raman, Security lead
- Has not reviewed Claude Code. Needs written answers before sign-off: what leaves the laptop, retention, training on our code, who can change settings.
- Known risk: some developers keep production DB credentials in `.env` files.
- Wants guardrails that developers cannot switch off themselves.

## Tom Becker, EM Dispatch
- Dispatch owns MeetingMemo and the scheduling service.
- Test coverage on the scheduler is thin; every release needs a manual regression pass.
- Has four volunteers on his team.

## Sofia Alvarez, EM Billing
- Billing test suite is the weakest in the company. Invoice proration bugs reached customers twice last quarter.
- Team is skeptical. Two seniors tried Claude six months ago and stopped.

## Jordan Pike, Finance controller
- Will ask for cost per developer and what the money bought.
- Approved up to $3,000 of usage for the pilot. Wants a weekly spend number.

## Developers (informal chats)
- **Kemi A. (dispatch, senior):** "The last tool rollout died in a month because nobody owned it after the vendor left."
- **Pablo G. (dispatch, junior):** eager; already uses Claude Code on side projects.
- **Lucas F. (billing, staff):** "I'll try it, but I'm not going to babysit an intern." Respected by the whole billing team.
- **Grace L. (billing, senior):** keeps the billing CLAUDE.md-style notes in a wiki page nobody reads.
