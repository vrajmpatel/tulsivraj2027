"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/utils/supabase/admin"

const PATH = "/guest-list"

export type ActionResult = { ok: true } | { ok: false; error: string }

/** Add a new person to the host-managed guest list (`invitee`). */
export async function addInvitee(formData: FormData): Promise<ActionResult> {
  const full_name = String(formData.get("full_name") ?? "").trim()
  if (!full_name) return { ok: false, error: "A name is required." }

  const email = String(formData.get("email") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const side = String(formData.get("side") ?? "").trim()
  const max_guests = Number(formData.get("max_guests")) || 1
  const notes = String(formData.get("notes") ?? "").trim()

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("invitee").insert({
      full_name,
      email: email || null,
      phone: phone || null,
      side: side || null,
      max_guests,
      notes: notes || null,
    })
    if (error) throw error
  } catch (e) {
    console.error("addInvitee failed:", e)
    return { ok: false, error: "Could not add invitee. Please try again." }
  }

  revalidatePath(PATH)
  return { ok: true }
}

/** Update an existing invitee's details. */
export async function updateInvitee(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing invitee id." }

  const full_name = String(formData.get("full_name") ?? "").trim()
  if (!full_name) return { ok: false, error: "A name is required." }

  const email = String(formData.get("email") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const side = String(formData.get("side") ?? "").trim()
  const max_guests = Number(formData.get("max_guests")) || 1
  const notes = String(formData.get("notes") ?? "").trim()

  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("invitee")
      .update({
        full_name,
        email: email || null,
        phone: phone || null,
        side: side || null,
        max_guests,
        notes: notes || null,
      })
      .eq("id", id)
    if (error) throw error
  } catch (e) {
    console.error("updateInvitee failed:", e)
    return { ok: false, error: "Could not update invitee. Please try again." }
  }

  revalidatePath(PATH)
  return { ok: true }
}

/** Remove an invitee. Any RSVP linked to them is unlinked (FK is ON DELETE SET NULL). */
export async function deleteInvitee(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing invitee id." }
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("invitee").delete().eq("id", id)
    if (error) throw error
  } catch (e) {
    console.error("deleteInvitee failed:", e)
    return { ok: false, error: "Could not delete invitee. Please try again." }
  }
  revalidatePath(PATH)
  return { ok: true }
}

/**
 * Connect (or disconnect) an RSVP to an invitee by setting `rsvp.invitee_id`.
 * Pass an empty `inviteeId` to clear the link.
 */
export async function linkRsvp(
  rsvpId: string,
  inviteeId: string,
): Promise<ActionResult> {
  if (!rsvpId) return { ok: false, error: "Missing RSVP id." }
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("rsvp")
      .update({ invitee_id: inviteeId || null })
      .eq("id", rsvpId)
    if (error) throw error
  } catch (e) {
    console.error("linkRsvp failed:", e)
    return { ok: false, error: "Could not update the link. Please try again." }
  }
  revalidatePath(PATH)
  return { ok: true }
}

/** Delete an RSVP response (e.g. a test or accidental submission). */
export async function deleteRsvp(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing RSVP id." }
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("rsvp").delete().eq("id", id)
    if (error) throw error
  } catch (e) {
    console.error("deleteRsvp failed:", e)
    return { ok: false, error: "Could not delete RSVP. Please try again." }
  }
  revalidatePath(PATH)
  return { ok: true }
}
