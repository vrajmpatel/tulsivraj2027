import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/rsvp
 *
 * Handles RSVP submissions from the public form. Runs server-side with the
 * service-role key so it can do something the public key cannot: check whether
 * this person has *already* submitted an RSVP. If a matching response exists
 * (same email, phone, or name) we don't insert a duplicate — instead we tell
 * the guest they're already on the list. Otherwise we record the RSVP.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const full_name = String(body.full_name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  const attending = Boolean(body.attending)
  const guest_count = Number(body.guest_count) || 1
  const message = String(body.message ?? '').trim()

  if (!full_name) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
  }

  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.error('RSVP route: admin client not configured:', e)
    return NextResponse.json(
      { error: 'The RSVP service is not configured yet. Please try again later.' },
      { status: 500 },
    )
  }

  // ---- Duplicate detection --------------------------------------------------
  // Look for an existing RSVP that matches this person. We match on any strong
  // identifier provided (email or phone), and fall back to a case-insensitive
  // name match so a re-submission without contact details is still caught.
  const orFilters: string[] = []
  if (email) orFilters.push(`email.ilike.${escapeOr(email)}`)
  if (phone) orFilters.push(`phone.eq.${escapeOr(phone)}`)
  orFilters.push(`full_name.ilike.${escapeOr(full_name)}`)

  const { data: existing, error: lookupError } = await supabase
    .from('rsvp')
    .select('id, full_name, created_at')
    .or(orFilters.join(','))
    .limit(1)

  if (lookupError) {
    console.error('RSVP lookup failed:', lookupError)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }

  if (existing && existing.length > 0) {
    return NextResponse.json(
      {
        duplicate: true,
        message:
          "It looks like you're already on our list — we've got your RSVP! If you need to make a change, please reach out to us directly.",
      },
      { status: 409 },
    )
  }

  // ---- Insert ---------------------------------------------------------------
  const { error: insertError } = await supabase.from('rsvp').insert({
    full_name,
    email: email || null,
    phone: phone || null,
    attending,
    guest_count,
    message: message || null,
  })

  if (insertError) {
    console.error('RSVP insert failed:', insertError)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}

/**
 * PostgREST `.or()` values are comma/parenthesis-delimited, so commas, parens,
 * and backslashes in user input must be wrapped in double quotes to be treated
 * literally. Quoting and escaping embedded quotes/backslashes is the safe path.
 */
function escapeOr(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}
