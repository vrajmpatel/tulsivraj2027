import { requireHost } from "@/lib/host-auth"
import { HostNavigation } from "@/components/host-navigation"
import type { Metadata } from "next"
import { BackButton } from "@/components/back-button"
import { GuestAdmin, type Invitee, type Rsvp } from "@/components/guest-admin"
import { createAdminClient, isAdminConfigured } from "@/utils/supabase/admin"

// Host authorization is checked before setup details or private data are read.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Guest List",
  robots: { index: false, follow: false, nocache: true },
}

export default async function GuestListPage() {
  await requireHost("/guest-list")
  if (!isAdminConfigured()) {
    return (
      <main className="admin-root" style={{ minHeight: "100vh" }}>
        <HostNavigation />
        <BackButton className="font-sans text-[13px] font-medium normal-case tracking-[0.02em] px-[15px] py-2 text-[oklch(0.52_0.012_70)] hover:text-[oklch(0.27_0.012_70)]" />
        <div className="wrap" style={{ paddingTop: 120, paddingBottom: 120 }}>
          <span className="kicker">Setup needed</span>
          <h1 className="sec-title">Almost there</h1>
          <p className="sec-intro">
            To view the guest list and RSVPs, add your Supabase service-role
            (secret) key to <code>.env.local</code> as{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code>, then restart the dev server.
            You&apos;ll find it in your Supabase dashboard under{" "}
            <em>Project Settings → API Keys</em>.
          </p>
        </div>
      </main>
    )
  }

  const supabase = createAdminClient()

  const [inviteeRes, rsvpRes] = await Promise.all([
    supabase
      .from("invitee")
      .select(
        "id, created_at, full_name, email, phone, side, max_guests, notes, invitation_sent, events",
      )
      .order("full_name", { ascending: true }),
    supabase
      .from("rsvp")
      .select(
        "id, created_at, invitee_id, full_name, email, phone, attending, guest_count, message",
      )
      .order("created_at", { ascending: false }),
  ])

  const loadError = inviteeRes.error?.message || rsvpRes.error?.message || null
  const invitees = (inviteeRes.data ?? []) as Invitee[]
  const rsvps = (rsvpRes.data ?? []) as Rsvp[]

  return (
    <main className="min-h-screen">
      <HostNavigation />
      <BackButton className="font-sans text-[13px] font-medium normal-case tracking-[0.02em] px-[15px] py-2 text-[oklch(0.52_0.012_70)] hover:text-[oklch(0.27_0.012_70)]" />
      <GuestAdmin invitees={invitees} rsvps={rsvps} loadError={loadError} />
    </main>
  )
}
