#!/usr/bin/env node
// Delivery Playbook metrics CLI. Reads a `gh pr list --json` export and
// prints a markdown report; writes the numbers as JSON for later comparison.
//
//   node delivery-metrics.mjs report  <prs.json> --from YYYY-MM-DD --to YYYY-MM-DD
//        [--authors cohort.txt] [--label test-backfill] [--name "Pilot cohort"] [--out metrics.json]
//   node delivery-metrics.mjs compare <before.json> <after.json>
//        [--control-before a.json --control-after b.json]
//   node delivery-metrics.mjs survey  <survey.csv>
//   node delivery-metrics.mjs usage   <usage.csv>

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { compareMetrics, computeMetrics, parseCsv, surveyAverages, usageSummary } from './metrics-lib.mjs'

function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) flags[argv[i].slice(2)] = argv[++i]
    else positional.push(argv[i])
  }
  return { positional, flags }
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const fmt = (v) => (v === null || v === undefined ? '—' : String(v))
const SUFFIX = { value: '%', pct: ' pp', perWeek: '/wk' }
const signed = (v, unit = 'value') => (v === null ? '—' : `${v > 0 ? '+' : ''}${v}${SUFFIX[unit]}`)

function readAuthors(spec) {
  if (!spec) return null
  // A file with one login per line (# comments allowed), or a comma list / single login.
  const text = existsSync(spec) ? readFileSync(spec, 'utf8') : spec.replaceAll(',', '\n')
  const logins = text.split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim()).filter(Boolean)
  return new Set(logins)
}

function report({ positional: [file], flags }) {
  if (!file || !flags.from || !flags.to) throw new Error('usage: report <prs.json> --from YYYY-MM-DD --to YYYY-MM-DD')
  const authors = readAuthors(flags.authors)
  const m = computeMetrics(readJson(file), { from: flags.from, to: flags.to, authors, label: flags.label ?? null })
  const name = flags.name ?? (authors ? `${authors.size} listed developers` : 'All human authors')
  const lines = [
    `## ${name}: ${m.window.from} to ${m.window.to} (${m.window.weeks} weeks)`,
    '',
    '| Metric | Value |',
    '|---|---|',
    `| Developers counted | ${m.devs} (${m.activeAuthors} merged at least one PR) |`,
    `| Merged PRs | ${m.prsMerged} |`,
    `| Merged PRs per dev-week | ${fmt(m.prsPerDevWeek)} |`,
    `| PR cycle time, median / p75 (h) | ${fmt(m.cycleTimeHours.median)} / ${fmt(m.cycleTimeHours.p75)} |`,
    `| Time to first review, median / p75 (h) | ${fmt(m.firstReviewHours.median)} / ${fmt(m.firstReviewHours.p75)} |`,
    `| Merged without review | ${fmt(m.mergedWithoutReviewPct)}% |`,
    `| PR size, median (lines changed) | ${fmt(m.prSizeLines.median)} |`,
    `| Revert rate | ${fmt(m.revertPct)}% |`,
  ]
  if (m.useCase) lines.push(`| Use-case PRs (label \`${m.useCase.label}\`) | ${m.useCase.prs} (${m.useCase.perWeek}/week) |`)
  if (m.prsMerged < 30) lines.push('', `> Warning: only ${m.prsMerged} merged PRs. Medians on samples this small move a lot from week to week.`)
  console.log(lines.join('\n'))
  if (flags.out) writeFileSync(flags.out, `${JSON.stringify({ name, ...m }, null, 2)}\n`)
}

function compare({ positional: [beforeFile, afterFile], flags }) {
  if (!beforeFile || !afterFile) throw new Error('usage: compare <before.json> <after.json> [--control-before a.json --control-after b.json]')
  const hasControl = Boolean(flags['control-before'] && flags['control-after'])
  const control = hasControl ? { before: readJson(flags['control-before']), after: readJson(flags['control-after']) } : null
  const rows = compareMetrics(readJson(beforeFile), readJson(afterFile), control)
  const header = hasControl
    ? ['| Metric | Before | After | Change | Comparison group change | Net of comparison |', '|---|---|---|---|---|---|']
    : ['| Metric | Before | After | Change |', '|---|---|---|---|']
  const body = rows.map((r) => {
    const cells = [r.label, fmt(r.before), fmt(r.after), signed(r.change, r.unit)]
    // Net is a difference of two changes: points for % and pp rows, PRs/week for the use case.
    if (hasControl) cells.push(signed(r.controlChange, r.unit), r.net === null ? '—' : `${r.net > 0 ? '+' : ''}${r.net}${r.unit === 'perWeek' ? '/wk' : ' pts'}`)
    return `| ${cells.join(' | ')} |`
  })
  console.log([...header, ...body].join('\n'))
}

function survey({ positional: [file] }) {
  if (!file) throw new Error('usage: survey <survey.csv>')
  const rows = surveyAverages(parseCsv(readFileSync(file, 'utf8')))
  console.log(['| Question | Answers | Mean (1-5) |', '|---|---|---|', ...rows.map((r) => `| ${r.question} | ${r.n} | ${r.mean} |`)].join('\n'))
}

function usage({ positional: [file] }) {
  if (!file) throw new Error('usage: usage <usage.csv>')
  const s = usageSummary(parseCsv(readFileSync(file, 'utf8')))
  const lines = [`Total cost: $${s.totalCostUsd.toFixed(2)}`, '', '| Week starting | Active users | Sessions | Cost (USD) |', '|---|---|---|---|']
  for (const w of s.weeks) lines.push(`| ${w.week} | ${w.activeUsers} | ${w.sessions} | ${w.costUsd.toFixed(2)} |`)
  lines.push('', '| User | Active days | Sessions | Cost (USD) |', '|---|---|---|---|')
  for (const u of s.users) lines.push(`| ${u.user} | ${u.activeDays} | ${u.sessions} | ${u.costUsd.toFixed(2)} |`)
  console.log(lines.join('\n'))
}

const commands = { report, compare, survey, usage }
const [command, ...rest] = process.argv.slice(2)
try {
  if (!commands[command]) throw new Error(`unknown command "${command ?? ''}". Use one of: ${Object.keys(commands).join(', ')}`)
  commands[command](parseArgs(rest))
} catch (err) {
  console.error(`delivery-metrics: ${err.message}`)
  process.exit(1)
}
