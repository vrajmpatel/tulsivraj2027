/**
 * A small in-process sliding-window rate limiter.
 *
 * This is the cheap first line of defence: it rejects a flood without touching
 * the database at all. It is deliberately *not* the only line -- serverless
 * instances are recycled and requests fan out across them, so a determined
 * attacker can outlive any one process's memory. The durable ceilings live in
 * the database (see the rsvp_enforce_caps trigger).
 */

/**
 * Each key carries the window it is counted over. Keys with different windows
 * share this map (a burst key and a daily key per client), so pruning has to
 * measure every entry against its own window rather than the caller's.
 */
type Entry = { times: number[]; windowMs: number }

const hits = new Map<string, Entry>()

/** Stop the map itself from becoming the memory leak we're defending against. */
const MAX_TRACKED_KEYS = 5000

export type RateLimitResult = {
  ok: boolean
  /** Seconds until the caller may retry. Only meaningful when `ok` is false. */
  retryAfter: number
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const cutoff = now - windowMs

  const recent = (hits.get(key)?.times ?? []).filter((time) => time > cutoff)

  if (recent.length >= limit) {
    hits.set(key, { times: recent, windowMs })
    const oldest = recent[0]
    return { ok: false, retryAfter: Math.ceil((oldest + windowMs - now) / 1000) }
  }

  recent.push(now)
  hits.set(key, { times: recent, windowMs })

  if (hits.size > MAX_TRACKED_KEYS) pruneExpired(now)

  return { ok: true, retryAfter: 0 }
}

function pruneExpired(now: number) {
  for (const [key, entry] of hits) {
    const live = entry.times.filter((time) => time > now - entry.windowMs)
    if (live.length === 0) hits.delete(key)
    else hits.set(key, { times: live, windowMs: entry.windowMs })
  }
  // Still oversized after pruning: drop the oldest keys rather than grow.
  if (hits.size > MAX_TRACKED_KEYS) {
    const excess = hits.size - MAX_TRACKED_KEYS
    let dropped = 0
    for (const key of hits.keys()) {
      hits.delete(key)
      if (++dropped >= excess) break
    }
  }
}
