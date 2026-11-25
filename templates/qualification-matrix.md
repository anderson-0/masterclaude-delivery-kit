# Use-case qualification matrix: <client>

Score each criterion 1–5. Any **blast radius** score of 1 disqualifies the item for a first pilot, whatever the total.

| Criterion | 1 | 3 | 5 |
|---|---|---|---|
| **Volume** | A one-off | A few per month | Dozens per week, across several people |
| **Repeatability** | Every instance is novel | Similar shape, different details | Same shape every time |
| **Measurability** | No checkable output | Output reviewed by a person | Output checked by a machine (tests, linters, CI) and visible in PR data |
| **Team readiness** | No owner, skeptical team | Owner exists, mixed interest | Named owner, volunteers, a credible champion |
| **Blast radius** (inverted: 5 = safe) | Production data, regulated code, irreversible | Internal code, reviewed before merge | Isolated, reversible, covered by CI |

| ID | Item | Vol | Rep | Meas | Ready | Blast | Total | Keep? | Why |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

**Primary use case:** <ID — one sentence on why>
**Backup use case:** <ID — what triggers the switch>
**Rejected, with reason:** <IDs and one line each; the sponsor will ask about the shiny ones>
