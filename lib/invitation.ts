/**
 * How an invitee's invitation went out.
 *
 * Three states rather than a boolean, because "how it was sent" is what decides
 * how to chase a non-response: a physical card that may still be in the post is
 * a different conversation from a WhatsApp message that was delivered and read.
 *
 * Shared by the server action (as validation) and the admin UI (as the radio
 * options), so the two can't drift. The database CHECK constraint carries the
 * same list, making three layers that agree.
 */
export const INVITATION_SENT_OPTIONS = [
  { value: "not_yet", label: "Not Yet" },
  { value: "physical", label: "Physical" },
  { value: "digital", label: "Digital" },
] as const

export type InvitationSent = (typeof INVITATION_SENT_OPTIONS)[number]["value"]

export const INVITATION_SENT_DEFAULT: InvitationSent = "not_yet"

const VALUES: readonly string[] = INVITATION_SENT_OPTIONS.map((o) => o.value)

/** True when `value` is one of the three accepted states. */
export function isInvitationSent(value: unknown): value is InvitationSent {
  return typeof value === "string" && VALUES.includes(value)
}

/** Human label for a stored value, falling back to "Not Yet" for anything odd. */
export function invitationSentLabel(value: string | null | undefined) {
  return (
    INVITATION_SENT_OPTIONS.find((o) => o.value === value)?.label ??
    INVITATION_SENT_OPTIONS[0].label
  )
}
