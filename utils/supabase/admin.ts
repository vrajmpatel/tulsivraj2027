import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client that uses the service-role (secret) key.
 *
 * This BYPASSES Row Level Security, so it can read the private `invitee`
 * guest list and all `rsvp` responses — neither of which is readable with the
 * public publishable key. NEVER import this from a Client Component or expose
 * the returned client to the browser. Management pages/actions must authorize
 * the host before using it. The public RSVP route validates submissions separately.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Support either env name — Supabase's legacy "service_role" JWT or the
  // newer "secret" API key both work as a full-access server key.
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in your environment (.env.local).',
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/** True when the service-role key is present — used to show a setup hint. */
export function isAdminConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY),
  )
}
