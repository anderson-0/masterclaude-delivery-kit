# Discovery notes: Ledgerline (Oct 2026)

## Henrik Sand, CIO (sponsor)
- Board review in 45 days. Wants a pilot plan with a measurable target and a cost cap.
- "The ledger migration is the thing that keeps me up at night. If AI cannot help there, I want to know that too."

## Aisha Karimi, CISO
- Bedrock in our AWS account or nothing. Model access must be pinned to approved model versions.
- Wants to see exactly which settings developers cannot override.
- Asks: what happens to telemetry, feedback reports and transcripts?
- Will not approve anything that touches the payments-core repo (PCI scope) in the first pilot.

## Rui Costa, EM Ledger
- 20 developers; about a third of the ledger modules are migrated.
- Each migrated module needs characterization tests first, then the upgrade, then two reviews and CAB approval.
- Review is the bottleneck: "my seniors spend half their week reviewing."

## Mette Lund, Head of Platform
- Owns laptops through MDM, so managed settings can be pushed.
- Wants plugins only from an internal marketplace, nothing from the internet.

## Finance (via the CIO's office)
- Needs cost per developer per month and a hard cap. Will compare against contractor rates for the migration.

## Developers (informal chats)
- **Ledger seniors:** worried that more PRs means more review load on them.
- **Onboarding team:** several volunteers, mostly greenfield work, easy wins.
- **Risk team:** heavy SQL and model-validation code; strict audit trail.
