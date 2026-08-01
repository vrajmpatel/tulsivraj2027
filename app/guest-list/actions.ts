"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/utils/supabase/admin"
import {
  INVITATION_SENT_DEFAULT,
  isInvitationSent,
  type InvitationSent,
} from "@/lib/invitation"
import { isWeddingEventId, normaliseEventIds } from "@/lib/events"

const PATH = "/guest-list"

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; duplicateOf?: string }

/** Lowercased and whitespace-collapsed, for comparing names and emails. */
function normText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ")
}

/**
 * Digits only, so "+1 (555) 123-4567" and "5551234567" compare equal. The last
 * 10 digits are what's compared, so a number stored with a country code still
 * matches the same number stored without one.
 */
function normPhone(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "")
  return digits.length > 10 ? digits.slice(-10) : digits
}

/**
 * Find an existing invitee that would collide with the details given.
 *
 * Compared in memory rather than with a database constraint: the guest list is
 * ~100 households, the host enters names in inconsistent shapes ("Raju mama
 * sangitamami"), and phone numbers arrive with and without country codes. A
 * unique index couldn't normalise across those; this can.
 *
 * `excludeId` lets an edit save without matching itself.
 */
async function findDuplicateInvitee(
  supabase: ReturnType<typeof createAdminClient>,
  fields: { full_name: string; email: string; phone: string },
  excludeId?: string,
): Promise<{ name: string; field: "name" | "email" | "phone" } | null> {
  const { data, error } = await supabase
    .from("invitee")
    .select("id, full_name, email, phone")
  if (error) throw error

  const name = normText(fields.full_name)
  const email = normText(fields.email)
  const phone = normPhone(fields.phone)

  for (const row of data ?? []) {
    if (excludeId && row.id === excludeId) continue
    if (email && normText(row.email) === email) {
      return { name: row.full_name, field: "email" }
    }
    if (phone && normPhone(row.phone) === phone) {
      return { name: row.full_name, field: "phone" }
    }
    if (name && normText(row.full_name) === name) {
      return { name: row.full_name, field: "name" }
    }
  }
  return null
}

const DUPLICATE_FIELD_LABEL = {
  name: "name",
  email: "email address",
  phone: "phone number",
} as const

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

    // Refuse the insert if this household is already on the list. With ~100
    // rows entered by hand over months, an accidental second entry is the
    // likely mistake, and a silent duplicate would mean a double invitation.
    const clash = await findDuplicateInvitee(supabase, { full_name, email, phone })
    if (clash) {
      return {
        ok: false,
        error: `"${clash.name}" is already on the guest list with that ${DUPLICATE_FIELD_LABEL[clash.field]}, so nothing was added.`,
        duplicateOf: clash.name,
      }
    }

    const { error } = await supabase.from("invitee").insert({
      full_name,
      email: email || null,
      phone: phone || null,
      side: side || null,
      max_guests,
      notes: notes || null,
      // Someone you've only just added hasn't been sent anything yet.
      invitation_sent: INVITATION_SENT_DEFAULT,
    })
    if (error) throw error
  } catch (e: any) {
    console.error("addInvitee failed:", e)
    return { ok: false, error: e?.message || "Could not add invitee. Please try again." }
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

  // Absent from the form means "leave it alone" rather than "reset it" — the
  // row's current value must survive an edit that doesn't mention it.
  const rawSent = formData.get("invitation_sent")
  const invitation_sent: Partial<{ invitation_sent: InvitationSent }> =
    rawSent === null ? {} : isInvitationSent(rawSent) ? { invitation_sent: rawSent } : {}

  // Checkboxes can't be told apart from "field not submitted" by their values
  // alone — all unticked and not-present both yield []. A marker input the form
  // always sends resolves it, so clearing every event is a real, saveable state.
  const eventsPresent = formData.has("events_present")
  const submittedEvents = formData.getAll("events").map(String)
  const events: Partial<{ events: string[] }> =
    eventsPresent && submittedEvents.every(isWeddingEventId)
      ? { events: normaliseEventIds(submittedEvents) }
      : {}

  try {
    const supabase = createAdminClient()

    // Same guard as adding, minus this row itself — saving an unchanged edit
    // must not report the invitee as a duplicate of themselves.
    const clash = await findDuplicateInvitee(supabase, { full_name, email, phone }, id)
    if (clash) {
      return {
        ok: false,
        error: `"${clash.name}" is already on the guest list with that ${DUPLICATE_FIELD_LABEL[clash.field]}, so nothing was changed.`,
        duplicateOf: clash.name,
      }
    }

    const { error } = await supabase
      .from("invitee")
      .update({
        full_name,
        email: email || null,
        phone: phone || null,
        side: side || null,
        max_guests,
        notes: notes || null,
        ...invitation_sent,
        ...events,
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
 * Record how an invitee's invitation went out ("Not Yet" / "Physical" /
 * "Digital"). Called straight from the radio group in the invitees table, so
 * it's a single-field update rather than a whole-row form submit.
 */
export async function setInvitationSent(
  id: string,
  value: string,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing invitee id." }
  // Validated here as well as by the CHECK constraint: this client uses the
  // service-role key, so nothing else stands between it and the table.
  if (!isInvitationSent(value)) {
    return { ok: false, error: "That is not a valid invitation status." }
  }

  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("invitee")
      .update({ invitation_sent: value })
      .eq("id", id)
    if (error) throw error
  } catch (e) {
    console.error("setInvitationSent failed:", e)
    return { ok: false, error: "Could not update the invitation status. Please try again." }
  }

  revalidatePath(PATH)
  return { ok: true }
}

/**
 * Set which events an invitee household is invited to.
 *
 * Takes the whole desired array rather than toggling one event, so rapid
 * clicking can't interleave into a half-applied state -- each call fully
 * describes the result it wants.
 */
export async function setInviteeEvents(
  id: string,
  events: string[],
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing invitee id." }
  if (!Array.isArray(events)) return { ok: false, error: "Invalid events." }
  // Validated here as well as by the CHECK constraint: this client uses the
  // service-role key, so nothing else stands between it and the table.
  if (!events.every(isWeddingEventId)) {
    return { ok: false, error: "That is not a valid event." }
  }

  // Drops duplicates and stores them in itinerary order, so the column always
  // reads the same way regardless of the order they were clicked.
  const clean = normaliseEventIds(events)

  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("invitee")
      .update({ events: clean })
      .eq("id", id)
    if (error) throw error
  } catch (e) {
    console.error("setInviteeEvents failed:", e)
    return { ok: false, error: "Could not update the events. Please try again." }
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
