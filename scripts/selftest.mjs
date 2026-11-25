#!/usr/bin/env node
// Pins the story the lessons tell about the Northwind fixtures, and checks the
// metric functions on hand-made data. Run after generate-fixtures.mjs.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compareMetrics, computeMetrics, firstReviewHours, parseCsv, percentile, surveyAverages, usageSummary } from './metrics-lib.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const nw = (f) => join(here, '..', 'clients', 'northwind', f)
const json = (f) => JSON.parse(readFileSync(f, 'utf8'))
const logins = (f) => new Set(readFileSync(f, 'utf8').split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean))

// Unit checks on hand-made data.
assert.equal(percentile([5, 1, 3], 50), 3)
assert.equal(percentile([], 50), null)
const pr = { author: { login: 'a' }, createdAt: '2026-01-01T00:00:00Z', mergedAt: '2026-01-02T00:00:00Z', reviews: [{ author: { login: 'a' }, submittedAt: '2026-01-01T01:00:00Z' }, { author: { login: 'b' }, submittedAt: '2026-01-01T03:00:00Z' }] }
assert.equal(firstReviewHours(pr), 3, 'self-reviews do not count')
const bot = { ...pr, author: { login: 'bot', is_bot: true } }
const m = computeMetrics([pr, bot, { ...pr, title: 'Revert "x"' }], { from: '2026-01-01', to: '2026-01-08' })
assert.equal(m.prsMerged, 2, 'bots are excluded')
assert.equal(m.revertPct, 50)
assert.deepEqual(surveyAverages(parseCsv('q1,"q, 2"\n4,2\n2,4\n')).map((x) => x.mean), [3, 3])
assert.equal(usageSummary(parseCsv('date,user,sessions,cost_usd\n2026-03-03,a,2,1.5\n2026-03-04,b,0,0\n')).weeks[0].activeUsers, 1)

// Northwind story.
const cohort = logins(nw('cohort.txt'))
const comparison = logins(nw('comparison.txt'))
const opts = (authors) => ({ authors, label: 'test-backfill' })
const before = (a) => computeMetrics(json(nw('prs-before-pilot.json')), { from: '2026-01-12', to: '2026-02-23', ...opts(a) })
const after = (a) => computeMetrics(json(nw('prs-day30.json')), { from: '2026-03-02', to: '2026-04-01', ...opts(a) })
const rows = Object.fromEntries(compareMetrics(before(cohort), after(cohort), { before: before(comparison), after: after(comparison) }).map((r) => [r.path, r]))
const story = [
  ['cohort cycle time falls 30-50%', rows['cycleTimeHours.median'].change <= -30 && rows['cycleTimeHours.median'].change >= -50],
  ['comparison cycle time moves under 15%', Math.abs(rows['cycleTimeHours.median'].controlChange) < 15],
  ['cohort review wait rises 20%+', rows['firstReviewHours.median'].change >= 20],
  ['comparison review wait moves under 12%', Math.abs(rows['firstReviewHours.median'].controlChange) < 12],
  ['cohort use-case throughput at least triples', rows['useCase.perWeek'].after >= 3 * rows['useCase.perWeek'].before],
  ['comparison use-case throughput does not rise', rows['useCase.perWeek'].controlChange <= 0],
  ['cohort throughput gain beats comparison', rows.prsPerDevWeek.net >= 10],
  ['comparison throughput moves under 12%', Math.abs(rows.prsPerDevWeek.controlChange) < 12],
  ['cohort revert rate does not improve', rows.revertPct.after >= rows.revertPct.before],
  ['cohort PRs get bigger', rows['prSizeLines.median'].change >= 25],
  ['comparison revert rate within 1.5 pp', Math.abs(rows.revertPct.controlChange) <= 1.5],
  ['comparison unreviewed share within 3 pp', Math.abs(rows.mergedWithoutReviewPct.controlChange) <= 3],
  ['cohort unreviewed share rises', rows.mergedWithoutReviewPct.change > 0],
]
const failed = story.filter(([, ok]) => !ok).map(([name]) => name)
assert.deepEqual(failed, [], `fixture story broken: ${failed.join('; ')}`)
console.log('selftest: all passed')
