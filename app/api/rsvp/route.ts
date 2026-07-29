import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { RSVP_LIMITS, rsvpSchema } from '@/lib/rsvp-schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Submissions allowed from one client, per window, before we start refusing. */
const BURST_LIMIT = 3
const BURST_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const DAILY_LIMIT = 8
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000

/** Refuse to grow the table past this. The DB trigger enforces its own ceiling. */
const MAX_TOTAL_RSVPS = 2000

/**
 * POST /api/rsvp
 *
 * The only write path into the `rsvp` table -- the table's RLS grants nothing
 * to the public keys, so the form cannot go around this route. Everything an
 * anonymous caller can do is bounded here: body size, field sizes, submission
 * rate per client, and total table size.
 *
 * Runs with the service-role key so it can check whether this person already
 * RSVP'd (the public key cannot read the table at all) before inserting.
 */
export async function POST(request: Request) {
  // ---- 1. Body size -------------------------------------------------------
  // Checked before parsing, and again while reading, so an enormous or
  // mis-declared payload never gets buffered into memory.
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > RSVP_LIMITS.bodyBytes) {
    return json({ error: 'That submission is too large.' }, 413)
  }

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return json({ error: 'Invalid request.' }, 415)
  }

  const raw = await readBounded(request, RSVP_LIMITS.bodyBytes)
  if (raw === null) {
    return json({ error: 'That submission is too large.' }, 413)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  // ---- 2. Field validation ------------------------------------------------
  const result = rsvpSchema.safeParse(parsed)
  if (!result.success) {
    const first = result.error.issues[0]
    return json({ error: first?.message ?? 'Please check the form and try again.' }, 400)
  }
  const { full_name, email, phone, attending, guest_count, message, website } = result.data

  // Honeypot tripped: almost certainly a bot. Report success so it doesn't
  // learn anything, and write nothing.
  if (website) {
    return json({ ok: true })
  }

  // ---- 3. Rate limiting ---------------------------------------------------
  // x-forwarded-for is only trustworthy because Vercel's edge overwrites it on
  // the way in. The in-memory check below is a fast filter; the durable limit
  // is the per-ip_hash ceiling in the database trigger.
  const ipHash = hashIp(clientIp(request))

  const burst = rateLimit(`rsvp:burst:${ipHash}`, BURST_LIMIT, BURST_WINDOW_MS)
  if (!burst.ok) return tooMany(burst.retryAfter)

  const daily = rateLimit(`rsvp:daily:${ipHash}`, DAILY_LIMIT, DAILY_WINDOW_MS)
  if (!daily.ok) return tooMany(daily.retryAfter)

  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.error('RSVP route: admin client not configured:', e)
    return json(
      { error: 'The RSVP service is not configured yet. Please try again later.' },
      500,
    )
  }

  // ---- 4. Durable ceilings ------------------------------------------------
  // The trigger enforces both of these regardless; checking here turns what
  // would be a 500 into a clear message.
  const { count: totalCount, error: countError } = await supabase
    .from('rsvp')
    .select('id', { count: 'exact', head: true })

  if (countError) {
    console.error('RSVP count failed:', countError)
    return json({ error: 'Something went wrong. Please try again.' }, 500)
  }

  if ((totalCount ?? 0) >= MAX_TOTAL_RSVPS) {
    return json(
      { error: 'We are not accepting new RSVPs online right now. Please reach out to us directly.' },
      503,
    )
  }

  const since = new Date(Date.now() - DAILY_WINDOW_MS).toISOString()
  const { count: recentFromClient, error: recentError } = await supabase
    .from('rsvp')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', since)

  if (recentError) {
    console.error('RSVP rate check failed:', recentError)
    return json({ error: 'Something went wrong. Please try again.' }, 500)
  }

  if ((recentFromClient ?? 0) >= DAILY_LIMIT) {
    return tooMany(Math.ceil(DAILY_WINDOW_MS / 1000))
  }

  // ---- 5. Duplicate detection ---------------------------------------------
  // Matches on a strong identifier (email or phone) when we were given one.
  // The name is only a fallback for submissions with no contact details at
  // all: two guests genuinely can share a name, and matching on it while a
  // distinct email says otherwise would lock a real guest out of RSVPing.
  // These are equality checks against normalised, generated columns -- user
  // input is never used as a search pattern.
  const orFilters: string[] = []
  if (email) orFilters.push(`email_norm.eq.${quote(email.toLowerCase())}`)
  if (phone) orFilters.push(`phone.eq.${quote(phone)}`)
  if (orFilters.length === 0) {
    orFilters.push(`full_name_norm.eq.${quote(full_name.toLowerCase())}`)
  }

  const { data: existing, error: lookupError } = await supabase
    .from('rsvp')
    .select('id')
    .or(orFilters.join(','))
    .limit(1)

  if (lookupError) {
    console.error('RSVP lookup failed:', lookupError)
    return json({ error: 'Something went wrong. Please try again.' }, 500)
  }

  if (existing && existing.length > 0) return duplicate()

  // ---- 6. Insert ----------------------------------------------------------
  const { error: insertError } = await supabase.from('rsvp').insert({
    full_name,
    email: email || null,
    phone: phone || null,
    attending,
    guest_count,
    message: message || null,
    ip_hash: ipHash,
  })

  if (insertError) {
    // The check above and this insert are not atomic, so two submissions
    // racing each other can both get past it. The unique index on email_norm
    // is what actually decides; losing that race means duplicate, not error.
    if (insertError.code === '23505') return duplicate()

    // Raised by the rsvp_enforce_caps trigger when a durable ceiling is hit.
    // Reachable when the in-memory counter has been lost to a cold start.
    if (insertError.code === '23514') {
      console.warn('RSVP rejected by database cap:', insertError.message)
      return tooMany(60)
    }

    console.error('RSVP insert failed:', insertError)
    return json({ error: 'Something went wrong. Please try again.' }, 500)
  }

  return json({ ok: true })
}

function duplicate() {
  return json(
    {
      duplicate: true,
      message:
        "It looks like you're already on our list — we've got your RSVP! If you need to make a change, please reach out to us directly.",
    },
    409,
  )
}

/** Responses are per-request and never cacheable by a proxy or the browser. */
function json(body: Record<string, unknown>, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  })
}

function tooMany(retryAfter: number) {
  return json(
    { error: "You've sent a few RSVPs already. Please try again later, or reach out to us directly." },
    429,
    { 'Retry-After': String(Math.max(retryAfter, 1)) },
  )
}

/**
 * Read the request body, giving up as soon as it exceeds `maxBytes` rather than
 * buffering whatever the caller decided to send. Returns null when the cap is hit.
 */
async function readBounded(request: Request, maxBytes: number): Promise<string | null> {
  const reader = request.body?.getReader()
  if (!reader) return ''

  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }

  const joined = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    joined.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(joined)
}

function clientIp(request: Request) {
  // Vercel overwrites x-forwarded-for at the edge and refuses to forward
  // externally-supplied values, so the first entry is the true client address
  // and a caller cannot inject their own. That guarantee is Vercel's; behind
  // any other proxy this would need revisiting.
  const forwarded = request.headers.get('x-forwarded-for')
  const raw = forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip')?.trim() || 'unknown'
  return ipBucket(raw)
}

/**
 * Collapse an address to the unit we actually rate limit on.
 *
 * An IPv4 client has one address, but an IPv6 client is routinely handed an
 * entire /64 -- billions of addresses it can rotate through at no cost. Keying
 * the limits on the exact address would hand anyone with IPv6 a fresh quota on
 * every single request, defeating both the in-memory counter and the database
 * trigger. So v6 addresses count against their /64 network instead.
 */
function ipBucket(ip: string) {
  if (!ip.includes(':')) return ip

  // Drop any zone id ("fe80::1%eth0") before parsing.
  const addr = ip.split('%')[0].toLowerCase()

  // ::ffff:1.2.3.4 is a v4 address wearing a v6 coat -- limit on the v4 part,
  // or every such client would land in one shared bucket.
  const mapped = addr.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mapped) return mapped[1]

  const hextets = expandIpv6(addr)
  return hextets ? `${hextets.slice(0, 4).join(':')}::/64` : addr
}

/** Expand `::` compression into all eight hextets. Null if it doesn't parse. */
function expandIpv6(addr: string): string[] | null {
  const halves = addr.split('::')
  if (halves.length > 2) return null

  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []

  let parts: string[]
  if (halves.length === 1) {
    if (head.length !== 8) return null
    parts = head
  } else {
    const fill = 8 - head.length - tail.length
    if (fill < 0) return null
    parts = [...head, ...Array<string>(fill).fill('0'), ...tail]
  }

  // Normalise leading zeros so 2001:0db8:… and 2001:db8:… share a bucket.
  const normalised = parts.map((part) => part.replace(/^0+(?=.)/, ''))
  return normalised.every((part) => /^[0-9a-f]{1,4}$/.test(part)) ? normalised : null
}

/**
 * Salted hash, so rate limiting works without the database ever holding a
 * guest's IP address. The salt falls back to the service key when
 * RSVP_IP_SALT isn't set -- both are server-only secrets.
 */
function hashIp(ip: string) {
  const salt =
    process.env.RSVP_IP_SALT ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    'tulsivraj'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

/**
 * PostgREST `.or()` values are comma/parenthesis-delimited, so commas, parens
 * and backslashes in user input must be double-quoted to be read literally.
 */
function quote(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}
