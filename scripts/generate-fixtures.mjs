#!/usr/bin/env node
// Regenerates the fictional client data in ../clients/ from a fixed seed, so
// every learner sees the same numbers the lessons quote. Course authors only:
// learners never need to run this. `node generate-fixtures.mjs` then
// `node selftest.mjs` (the self-test pins the story the lessons tell).

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'clients')
const DAY = 24 * 3600 * 1000

function rng(seed) {
  // mulberry32: tiny, deterministic, good enough for fixtures.
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeTools(seed) {
  const r = rng(seed)
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r())
  const logNormal = (median, spread) => median * Math.exp(spread * normal())
  const pick = (arr) => arr[Math.floor(r() * arr.length)]
  // Poisson by inversion; fine for the small rates used here.
  const poisson = (lambda) => {
    let k = 0
    let p = Math.exp(-lambda)
    let s = p
    const u = r()
    while (u > s) { k++; p *= lambda / k; s += p }
    return k
  }
  return { r, logNormal, pick, poisson }
}

const iso = (ms) => new Date(Math.round(ms / 1000) * 1000).toISOString().replace('.000Z', 'Z')

const TITLES = {
  'test-backfill': ['Add tests for invoice proration', 'Backfill tests for job scheduler', 'Cover technician assignment edge cases', 'Add unit tests for route optimizer', 'Test coverage for parts inventory sync'],
  feature: ['Add bulk reassignment to dispatch board', 'Show SLA countdown on work orders', 'Customer signature capture on close-out', 'Filter jobs by region', 'Export timesheets to CSV'],
  bugfix: ['Fix timezone drift in visit reminders', 'Fix duplicate notifications on reschedule', 'Handle empty parts list on close-out', 'Fix pagination on technician search'],
  chore: ['Bump eslint config', 'Rename legacy env vars', 'Clean up unused feature flags', 'Update API client'],
}

/** One merged PR per call, shaped like `gh pr list --json` output. */
function makePr(t, number, author, teammates, createdMs, p) {
  const titles = p.titles ?? TITLES
  const isUseCase = t.r() < p.useCaseShare
  const kind = isUseCase ? p.useCaseLabel : t.pick(['feature', 'feature', 'bugfix', 'chore'])
  const cycleH = Math.max(0.5, t.logNormal(p.cycleMedianH, 0.75))
  const merged = createdMs + cycleH * 3600 * 1000
  const reviews = []
  if (t.r() >= p.noReviewShare) {
    const reviewH = Math.min(cycleH * 0.9, Math.max(0.2, t.logNormal(p.reviewMedianH, 0.8)))
    const first = t.pick(teammates)
    reviews.push({ author: { login: first }, state: 'APPROVED', submittedAt: iso(createdMs + reviewH * 3600 * 1000) })
    // Second approval (Ledgerline's two-reviewer rule) is derived, not drawn,
    // so adding it leaves every other generated value unchanged.
    if (p.approvals === 2) {
      const second = teammates.find((x) => x !== first)
      reviews.push({ author: { login: second }, state: 'APPROVED', submittedAt: iso(createdMs + ((reviewH + cycleH * 0.95) / 2) * 3600 * 1000) })
    }
  }
  const size = Math.round(t.logNormal(p.sizeMedian, 0.7))
  const revert = t.r() < p.revertShare
  const base = titles[kind] ? t.pick(titles[kind]) : p.useCaseTitle ? p.useCaseTitle(number) : `Work on ${kind}`
  return {
    number,
    title: revert ? `Revert "${t.pick(titles.feature)}"` : base,
    author: { login: author, is_bot: false },
    createdAt: iso(createdMs),
    mergedAt: iso(merged),
    additions: Math.round(size * 0.7),
    deletions: size - Math.round(size * 0.7),
    labels: isUseCase ? [{ name: p.useCaseLabel }] : titles[kind] && kind !== 'feature' ? [{ name: kind }] : [],
    reviews,
  }
}

function generatePrs(t, roster, windows, paramsFor, startNumber) {
  const prs = []
  let number = startNumber
  for (const w of windows) {
    const days = (Date.parse(w.to) - Date.parse(w.from)) / DAY
    for (const dev of roster) {
      const p = paramsFor(dev, w.phase)
      const team = roster.filter((d) => d.team === dev.team && d.login !== dev.login).map((d) => d.login)
      const count = t.poisson((p.prsPerWeek * days) / 7)
      for (let i = 0; i < count; i++) {
        // Weekdays only, 08:00–18:00 UTC.
        let created
        do created = Date.parse(w.from) + Math.floor(t.r() * days) * DAY + (8 + t.r() * 10) * 3600 * 1000
        while ([0, 6].includes(new Date(created).getUTCDay()))
        prs.push(makePr(t, number++, dev.login, team, created, p))
      }
    }
  }
  // A few dependency-bot PRs: the metrics script must ignore them.
  for (let i = 0; i < 12; i++) {
    const created = Date.parse(windows[0].from) + t.r() * (Date.parse(windows.at(-1).to) - Date.parse(windows[0].from) - 2 * DAY)
    prs.push({ number: number++, title: 'Bump lodash from 4.17.20 to 4.17.21', author: { login: 'dependabot', is_bot: true }, createdAt: iso(created), mergedAt: iso(created + 3 * 3600 * 1000), additions: 4, deletions: 4, labels: [{ name: 'dependencies' }], reviews: [] })
  }
  return prs.sort((a, b) => Date.parse(b.mergedAt) - Date.parse(a.mergedAt)) // newest first, like gh
}

function makeRoster(t, logins, teams) {
  const levels = ['junior', 'mid', 'mid', 'senior', 'senior', 'staff']
  return logins.map((login, i) => ({ login, team: teams[i % teams.length], seniority: t.pick(levels), volunteered: t.r() < 0.35 ? 'yes' : 'no' }))
}

const csv = (rows) => rows.map((r) => r.map((c) => (/[",]/.test(String(c)) ? `"${String(c).replaceAll('"', '""')}"` : c)).join(',')).join('\n') + '\n'
const write = (dir, name, content) => { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, name), content) }
const writeJson = (dir, name, data) => write(dir, name, `${JSON.stringify(data, null, 1)}\n`)

// ── Northwind Field Services (guided brief) ────────────────────────────────
function northwind() {
  const t = makeTools(Number(process.env.NORTHWIND_SEED ?? 75))
  const dir = join(ROOT, 'northwind')
  const logins = ['amara-o', 'ben-k', 'carla-m', 'deshawn-p', 'elif-y', 'farid-h', 'grace-l', 'hiro-t', 'ines-r', 'jonas-w', 'kemi-a', 'lucas-f', 'mei-c', 'nikhil-s', 'olga-v', 'pablo-g', 'quinn-d', 'rosa-b', 'sami-e', 'tomas-n', 'uma-j', 'victor-z', 'wen-x', 'xavier-q', 'yara-i', 'zane-u', 'abby-c', 'bilal-r', 'chloe-t', 'dmitri-k', 'esme-w', 'felix-b', 'gita-m', 'hugo-l', 'isla-p', 'jamal-s', 'kai-o', 'lena-h', 'marco-v', 'nora-f']
  const roster = makeRoster(t, logins, ['dispatch', 'billing', 'mobile', 'platform', 'integrations'])
  // Decided in the pilot-design lesson: mixed seniority, volunteers first, two teams.
  const cohort = ['amara-o', 'farid-h', 'kemi-a', 'pablo-g', 'ben-k', 'grace-l', 'lucas-f', 'quinn-d']
  const comparison = ['uma-j', 'zane-u', 'esme-w', 'jamal-s', 'victor-z', 'abby-c', 'felix-b', 'kai-o']
  for (const d of roster) if (cohort.includes(d.login)) d.volunteered = 'yes'
  const base = { prsPerWeek: 2.0, cycleMedianH: 50, reviewMedianH: 9, sizeMedian: 140, revertShare: 0.02, noReviewShare: 0.05, useCaseShare: 0.07, useCaseLabel: 'test-backfill' }
  const paramsFor = (dev, phase) => {
    if (phase === 'pilot' && cohort.includes(dev.login)) {
      return { ...base, prsPerWeek: 2.9, cycleMedianH: 31, reviewMedianH: 14, sizeMedian: 210, revertShare: 0.035, noReviewShare: 0.08, useCaseShare: 0.32 }
    }
    // Everyone else drifts a little better in March (fewer holidays): this is
    // exactly why the readout nets changes against the comparison group.
    if (phase === 'pilot') return { ...base, prsPerWeek: 2.1, cycleMedianH: 46 }
    return base
  }
  const windows = [
    { phase: 'before', from: '2026-01-05', to: '2026-01-12' },
    { phase: 'baseline', from: '2026-01-12', to: '2026-02-23' },
    { phase: 'pre-kickoff', from: '2026-02-23', to: '2026-03-02' },
    { phase: 'pilot', from: '2026-03-02', to: '2026-04-01' },
  ]
  const all = generatePrs(t, roster, windows, paramsFor, 3100)
  // Exported Feb 27, in the pre-kickoff week: only PRs merged by then.
  writeJson(dir, 'prs-before-pilot.json', all.filter((pr) => pr.mergedAt < '2026-02-27'))
  writeJson(dir, 'prs-day30.json', all)
  write(dir, 'roster.csv', csv([['login', 'team', 'seniority', 'volunteered'], ...roster.map((d) => [d.login, d.team, d.seniority, d.volunteered])]))
  write(dir, 'cohort.txt', `# Pilot cohort, agreed in the pilot charter\n${cohort.join('\n')}\n`)
  write(dir, 'comparison.txt', `# Comparison group: same two teams, no Claude Code until Day 30. Seniority differs: no staff engineers (see the pilot charter)\n${comparison.join('\n')}\n`)

  // Daily usage for the cohort during the pilot (shape of a telemetry export).
  const usage = [['date', 'user', 'sessions', 'cost_usd', 'lines_added']]
  for (let d = Date.parse('2026-03-02'); d < Date.parse('2026-04-01'); d += DAY) {
    const wd = new Date(d).getUTCDay()
    if (wd === 0 || wd === 6) continue
    const week = Math.floor((d - Date.parse('2026-03-02')) / (7 * DAY))
    cohort.forEach((user, i) => {
      // Two billing cohort members get a low activity probability from week 2 on.
      // With the pinned seed the fade becomes visible in week 4 (Lesson 6 relies on that).
      const fading = (user === 'lucas-f' || user === 'quinn-d') && week >= 1
      const activeP = fading ? 0.2 : 0.55 + week * 0.1
      const sessions = t.r() < activeP ? 1 + t.poisson(2 + i * 0.1) : 0
      const cost = sessions ? Math.round(t.logNormal(4.2 * sessions, 0.5) * 100) / 100 : 0
      usage.push([new Date(d).toISOString().slice(0, 10), user, sessions, cost.toFixed(2), sessions ? Math.round(t.logNormal(180 * sessions, 0.6)) : 0])
    })
  }
  write(dir, 'usage-day30.csv', csv(usage))

  const questions = ['I can finish a typical task without waiting on others', 'I trust the code that reaches review', 'Reviewing PRs takes a reasonable share of my week', 'I know which tasks Claude Code is good for', 'I would recommend our current dev setup']
  const survey = (shift) => [questions, ...cohort.map(() => questions.map((_, q) => Math.min(5, Math.max(1, Math.round(3 + shift[q] + (t.r() - 0.5) * 1.6)))))]
  write(dir, 'survey-baseline.csv', csv(survey([0, 0.3, 0, -1, 0])))
  write(dir, 'survey-day30.csv', csv(survey([0.7, 0.1, -0.6, 1.1, 0.5])))
}

// ── Ledgerline Payments (capstone brief): baseline only ────────────────────
// Same keys and list lengths as TITLES' non-use-case kinds, so swapping the
// wording does not change how many random draws a PR takes.
const LEDGERLINE_TITLES = {
  feature: ['Add SEPA instant payout option', 'Show settlement status per merchant', 'Support multi-currency invoices', 'Add webhook retries for payout events', 'Export reconciliation report to CSV'],
  bugfix: ['Fix rounding in FX conversion', 'Fix duplicate ledger entries on retry', 'Handle empty batch in settlement job', 'Fix timezone in daily close report'],
  chore: ['Bump checkstyle config', 'Rename legacy config keys', 'Remove unused feature toggles', 'Update internal API client'],
}
function ledgerline() {
  const t = makeTools(20260907)
  const dir = join(ROOT, 'ledgerline')
  const first = ['ada', 'bo', 'cy', 'di', 'ed', 'fe', 'gu', 'ha', 'io', 'ju', 'ky', 'li', 'mo', 'nu', 'ot', 'pi', 'ra', 'su', 'ty', 'vo']
  const logins = first.flatMap((f, i) => ['a', 'b', 'c', 'd', 'e', 'f'].map((s) => `${f}-${s}${i}`))
  const roster = makeRoster(t, logins, ['payments-core', 'ledger', 'risk', 'onboarding', 'platform', 'mobile'])
  const params = (dev) => ({
    prsPerWeek: dev.team === 'ledger' ? 1.1 : 1.6,
    cycleMedianH: dev.team === 'ledger' ? 96 : 68,
    reviewMedianH: 20, // two-reviewer rule on regulated code
    sizeMedian: 120,
    revertShare: 0.015,
    noReviewShare: 0,
    useCaseShare: dev.team === 'ledger' ? 0.12 : 0.04,
    useCaseLabel: 'legacy-migration',
    useCaseTitle: (n) => `Migrate ledger module ${String(n % 140).padStart(3, '0')} to Java 21`,
    approvals: 2,
    titles: LEDGERLINE_TITLES,
  })
  const windows = [{ phase: 'baseline', from: '2026-08-31', to: '2026-10-12' }]
  writeJson(dir, 'prs-before-pilot.json', generatePrs(t, roster, windows, params, 18000))
  write(dir, 'roster.csv', csv([['login', 'team', 'seniority', 'volunteered'], ...roster.map((d) => [d.login, d.team, d.seniority, d.volunteered])]))
}

northwind()
ledgerline()
console.log(`fixtures written to ${ROOT}`)
