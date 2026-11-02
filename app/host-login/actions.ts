"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getHostUser, hostDestination, isHostUser } from "@/lib/host-auth"

export type SignInState = { error: string | null }

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const failure = { error: "Unable to sign in. Check your credentials and host access." }

  if (!email || email.length > 254 || !password || password.length > 1024 || !process.env.ADMIN_EMAILS?.trim()) {
    return failure
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return failure
    if (!isHostUser(data.user) || !(await getHostUser())) {
      await supabase.auth.signOut({ scope: "local" })
      return failure
    }
  } catch {
    return failure
  }

  // Only known management paths are accepted, preventing open redirects.
  redirect(hostDestination(formData.get("next")))
}

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut({ scope: "local" })
  if (error) throw new Error("Unable to sign out. Please try again.")
  redirect("/host-login")
}
