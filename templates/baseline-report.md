# Baseline report: <client>

**Window:** <from> → <to> (<n> weeks) · **Export taken:** <date, by whom> · **Signed off by:** <sponsor> on <date>

## How the data was collected
```bash
gh pr list --repo <org>/<repo> --state merged --limit 1000 \
  --json number,title,author,createdAt,mergedAt,additions,deletions,labels,reviews > prs-before-pilot.json
node delivery-kit/scripts/delivery-metrics.mjs report prs-before-pilot.json --from <from> --to <to> \
  --authors cohort.txt --label <use-case-label> --name "Pilot cohort, baseline" --out baseline-cohort.json
```

## Numbers
<Paste the cohort table, the comparison-group table and the whole-org table.>

## Use-case metric
<What the label counts, how it was applied, and its baseline value. Report absolute counts next to rates.>

## Developer-experience survey (cohort)
<Paste `survey` output. Say who answered and when.>

## Known gaps in this baseline
<Holidays in the window, label hygiene, reorgs, small samples. Write them down now, not at the readout.>
