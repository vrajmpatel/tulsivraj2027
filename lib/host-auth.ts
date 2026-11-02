import "server-only"

import type { User } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

type HostIdentity = Pick<User, "email" | "email_confirmed_at" | "is_anonymous">

export function isHostUser(user: HostIdentity | null): boolean {
  if (!user?.email || !user.email_confirmed_at || user.is_anonymous) return false
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(user.email.trim().toLowerCase())
}

export async function getHostUser(): Promise<User | null> {
  if (!process.env.ADMIN_EMAILS?.trim()) return null
  try {
    const supabase = await createClient()
    // Verify with Auth on every request; cookie contents alone aren't authority.
    const { data, error } = await supabase.auth.getUser()
    return !error && isHostUser(data.user) ? data.user : null
  } catch {
    // Missing configuration or unavailable Auth must never grant admin access.
    return null
  }
}

export function hostDestination(value: unknown): "/guest-list" | "/task-list" {
  return value === "/task-list" ? "/task-list" : "/guest-list"
}

/** Call in each page and action, before any privileged database access. */
export async function requireHost(destination: string = "/guest-list") {
  const user = await getHostUser()
  if (!user) redirect(`/host-login?next=${encodeURIComponent(hostDestination(destination))}`)
  return user
}
