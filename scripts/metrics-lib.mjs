// Pure metric functions for the Delivery Playbook kit. No dependencies, so a
// learner can run them on any machine that has Node (Claude Code needs Node).
// Input shape is exactly what `gh pr list --json` returns (see README).

const HOUR = 3600 * 1000

export function percentile(values, p) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  // Nearest-rank percentile: simple, explainable to a CFO, no interpolation.
  const rank = Math.max(1, Math.ceil((p / 100) * sorted.length))
  return sorted[rank - 1]
}

const round1 = (n) => (n === null ? null : Math.round(n * 10) / 10)

/** Merged, human-authored PRs whose mergedAt falls in [from, to). */
export function selectPrs(prs, { from, to, authors = null, includeBots = false }) {
  const start = Date.parse(from)
  const end = Date.parse(to)
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) throw new Error(`invalid window: ${from} .. ${to}`)
  return prs.filter((pr) => {
    if (!pr.mergedAt) return false
    const merged = Date.parse(pr.mergedAt)
    if (merged < start || merged >= end) return false
    if (!includeBots && pr.author?.is_bot) return false
    if (authors && !authors.has(pr.author?.login)) return false
    return true
  })
}

/** First review by someone other than the author, in hours after the PR opened. */
export function firstReviewHours(pr) {
  const created = Date.parse(pr.createdAt)
  const times = (pr.reviews ?? [])
    .filter((r) => r.author?.login !== pr.author?.login && r.submittedAt)
    .map((r) => Date.parse(r.submittedAt))
    .filter((t) => t >= created)
  if (times.length === 0) return null
  return (Math.min(...times) - created) / HOUR
}

export function computeMetrics(prs, { from, to, authors = null, label = null, cohortSize = null }) {
  const selected = selectPrs(prs, { from, to, authors })
  const weeks = (Date.parse(to) - Date.parse(from)) / (7 * 24 * HOUR)
  const activeAuthors = new Set(selected.map((pr) => pr.author.login)).size
  // Divide by the declared cohort, not by who happened to merge: people who
  // merged nothing still count against throughput.
  const devs = cohortSize ?? authors?.size ?? activeAuthors
  const cycle = selected.map((pr) => (Date.parse(pr.mergedAt) - Date.parse(pr.createdAt)) / HOUR)
  const review = selected.map(firstReviewHours).filter((h) => h !== null)
  const size = selected.map((pr) => (pr.additions ?? 0) + (pr.deletions ?? 0))
  const reverts = selected.filter((pr) => /^revert\b/i.test(pr.title ?? '')).length
  const labeled = label ? selected.filter((pr) => (pr.labels ?? []).some((l) => l.name === label)).length : null
  const n = selected.length
  return {
    window: { from, to, weeks: round1(weeks) },
    devs,
    activeAuthors,
    prsMerged: n,
    prsPerDevWeek: devs && weeks ? round1(n / devs / weeks) : null,
    cycleTimeHours: { median: round1(percentile(cycle, 50)), p75: round1(percentile(cycle, 75)) },
    firstReviewHours: { median: round1(percentile(review, 50)), p75: round1(percentile(review, 75)) },
    mergedWithoutReviewPct: n ? round1(((n - review.length) / n) * 100) : null,
    prSizeLines: { median: percentile(size, 50) },
    revertPct: n ? round1((reverts / n) * 100) : null,
    useCase: label ? { label, prs: labeled, perWeek: weeks ? round1(labeled / weeks) : null } : null,
  }
}

// [path in metrics object, label, which direction is better, unit]. Rates
// that are already percentages change in percentage points (pp): "+1200%" on
// a 0.3% revert rate is noise dressed up as a finding. The use-case rate
// changes in PRs per week: its baseline is often tiny, and "+2300%" on a base
// of two PRs belongs on no slide.
export const METRIC_ROWS = [
  ['prsPerDevWeek', 'Merged PRs per dev-week', 'up', 'value'],
  ['cycleTimeHours.median', 'PR cycle time, median (h)', 'down', 'value'],
  ['cycleTimeHours.p75', 'PR cycle time, p75 (h)', 'down', 'value'],
  ['firstReviewHours.median', 'Time to first review, median (h)', 'down', 'value'],
  ['mergedWithoutReviewPct', 'Merged without review (%)', 'down', 'pct'],
  ['prSizeLines.median', 'PR size, median (lines)', 'neutral', 'value'],
  ['revertPct', 'Revert rate (%)', 'down', 'pct'],
  ['useCase.perWeek', 'Use-case PRs per week', 'up', 'perWeek'],
]

export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? null : o[k]), obj)
}

export function pctChange(before, after) {
  if (before === null || after === null || before === undefined || after === undefined || before === 0) return null
  return round1(((after - before) / before) * 100)
}

/** Relative change for values; absolute change for rates (pp, PRs per week). */
export function change(before, after, unit) {
  if (unit === 'value') return pctChange(before, after)
  if (before === null || after === null || before === undefined || after === undefined) return null
  return round1(after - before)
}

/** Rows of before/after/change, plus the change net of a comparison group when given. */
export function compareMetrics(before, after, control = null) {
  return METRIC_ROWS.map(([path, label, better, unit]) => {
    const b = getPath(before, path)
    const a = getPath(after, path)
    const delta = change(b, a, unit)
    const controlChange = control ? change(getPath(control.before, path), getPath(control.after, path), unit) : null
    // Difference in differences. Crude on purpose: with 8-person cohorts it is
    // a sanity check, not a statistical test.
    const net = delta !== null && controlChange !== null ? round1(delta - controlChange) : null
    return { path, label, better, unit, before: b, after: a, change: delta, controlChange, net }
  })
}

/** Average of each numeric column of a survey CSV (one row per answer sheet). */
export function surveyAverages(rows) {
  const [header, ...data] = rows
  return header
    .map((q, i) => {
      const nums = data.map((r) => Number(r[i])).filter((v) => !Number.isNaN(v))
      return nums.length ? { question: q, n: nums.length, mean: round1(nums.reduce((s, v) => s + v, 0) / nums.length) } : null
    })
    .filter(Boolean)
}

/** Per-user and per-week usage totals from a telemetry CSV export. */
export function usageSummary(rows) {
  const [header, ...data] = rows
  const col = (name) => {
    const i = header.indexOf(name)
    if (i < 0) throw new Error(`usage CSV is missing column "${name}"`)
    return i
  }
  const [d, u, s, c] = [col('date'), col('user'), col('sessions'), col('cost_usd')]
  const users = new Map()
  const weeks = new Map()
  for (const r of data) {
    const user = r[u]
    const cost = Number(r[c])
    const sessions = Number(r[s])
    const prev = users.get(user) ?? { sessions: 0, costUsd: 0, activeDays: 0 }
    users.set(user, { sessions: prev.sessions + sessions, costUsd: prev.costUsd + cost, activeDays: prev.activeDays + (sessions > 0 ? 1 : 0) })
    const week = isoWeekStart(r[d])
    const w = weeks.get(week) ?? { activeUsers: new Set(), sessions: 0, costUsd: 0 }
    if (sessions > 0) w.activeUsers.add(user)
    w.sessions += sessions
    w.costUsd += cost
    weeks.set(week, w)
  }
  const totalCost = [...users.values()].reduce((sum, x) => sum + x.costUsd, 0)
  return {
    totalCostUsd: Math.round(totalCost * 100) / 100,
    users: [...users].map(([user, x]) => ({ user, ...x, costUsd: Math.round(x.costUsd * 100) / 100 })),
    weeks: [...weeks].sort().map(([week, w]) => ({ week, activeUsers: w.activeUsers.size, sessions: w.sessions, costUsd: Math.round(w.costUsd * 100) / 100 })),
  }
}

function isoWeekStart(date) {
  const t = new Date(`${date}T00:00:00Z`)
  const day = (t.getUTCDay() + 6) % 7 // Monday = 0
  t.setUTCDate(t.getUTCDate() - day)
  return t.toISOString().slice(0, 10)
}

/** Minimal CSV parser: comma-separated, double-quoted fields, no embedded newlines. */
export function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const out = []
      let cur = ''
      let quoted = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (quoted && ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
        else if (ch === '"') quoted = !quoted
        else if (ch === ',' && !quoted) { out.push(cur); cur = '' }
        else cur += ch
      }
      out.push(cur)
      return out
    })
}
