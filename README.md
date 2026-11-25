# Delivery kit — Claude Code Delivery Playbook

Course materials for the Delivery Playbook course on [masterclaude.dev](https://masterclaude.dev). Everything here runs with Node 18+ and no other dependencies.

## Get the kit

Clone it into a folder named `delivery-kit`, inside the working folder you use for the course. The lessons run commands from that working folder (`node delivery-kit/scripts/...`) and write their outputs to `engagement/` next to it.

```bash
mkdir delivery-course && cd delivery-course
git clone --depth 1 https://github.com/anderson-0/masterclaude-delivery-kit.git delivery-kit
node delivery-kit/scripts/selftest.mjs
```

You can also click **Use this template** on GitHub to get your own copy.

Northwind Field Services and Ledgerline Payments are fictional companies. All their data is generated.

```
delivery-kit/
├── clients/
│   ├── northwind/        guided brief (lessons 1–9): brief, notes, backlog, roster, PR exports, usage, survey
│   └── ledgerline/       capstone brief: brief, notes, backlog, roster, baseline PR export
├── templates/            the Delivery Plan Pack templates (markdown)
├── starter-plugin/       a client-owned marketplace with one plugin: two skills + a secrets guardrail hook
├── managed-settings.example.json
└── scripts/
    ├── delivery-metrics.mjs   report / compare / survey / usage
    ├── metrics-lib.mjs        the metric definitions (read these: they are the contract with the client)
    ├── selftest.mjs           checks the metric functions and the Northwind fixtures
    └── generate-fixtures.mjs  course authors only: rebuilds clients/ from a fixed seed
```

## Export PR data from a real client

```bash
gh pr list --repo <org>/<repo> --state merged --limit 1000 \
  --json number,title,author,createdAt,mergedAt,additions,deletions,labels,reviews > prs.json
```

`--limit` caps the export: check that the oldest `mergedAt` in the file is older than your window start, or raise the limit. Run it once per repository and merge the arrays if the cohort works across several repos.

## Commands

```bash
# Baseline for the pilot cohort (6-week window), saved for later comparison
node scripts/delivery-metrics.mjs report clients/northwind/prs-before-pilot.json \
  --from 2026-01-12 --to 2026-02-23 --authors clients/northwind/cohort.txt \
  --label test-backfill --name "Pilot cohort, baseline" --out baseline-cohort.json

# Day 30 vs baseline, netted against the comparison group
node scripts/delivery-metrics.mjs compare baseline-cohort.json day30-cohort.json \
  --control-before baseline-comparison.json --control-after day30-comparison.json

node scripts/delivery-metrics.mjs survey clients/northwind/survey-day30.csv
node scripts/delivery-metrics.mjs usage  clients/northwind/usage-day30.csv
node scripts/selftest.mjs
```

## Metric definitions (short version)

- Only merged PRs whose `mergedAt` falls in `[from, to)` count. Bot authors (`author.is_bot`) are excluded.
- **Cycle time:** `mergedAt − createdAt`, in hours. Median and p75 (nearest rank).
- **Time to first review:** first review by someone other than the author.
- **Merged without review:** merged PRs with no review from anyone but the author.
- **Revert rate:** merged PRs whose title starts with `Revert`.
- **Per dev-week:** merged PRs ÷ developers in the list (including those who merged nothing) ÷ weeks.
- Rates that are already percentages change in **percentage points**, not percent.

## Windows

The scripts are plain Node and run in PowerShell, Git Bash or WSL. The plugin's guardrail hook is a bash script: on native Windows, Claude Code runs hook commands in Git Bash, and falls back to PowerShell (where this hook fails) when Git Bash is not installed. Install Git for Windows, or set `CLAUDE_CODE_GIT_BASH_PATH`. Under WSL, keep the repo inside the Linux filesystem (`~/`), not `/mnt/c`.
