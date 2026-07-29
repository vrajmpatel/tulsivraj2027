import { z } from "zod"

/**
 * Limits for the public RSVP form. Shared by the client (as `maxLength` hints)
 * and the API route (as hard validation). The database carries matching CHECK
 * constraints, so all three layers agree.
 */
export const RSVP_LIMITS = {
  fullName: 120,
  email: 200,
  phone: 40,
  message: 2000,
  guestCount: 20,
  /** Largest request body we'll read before hanging up. */
  bodyBytes: 8 * 1024,
} as const

/** Treat null/undefined as "not provided" so optional fields can arrive either way. */
const optionalText = (max: number) =>
  z.preprocess(
    (value) => (value === null || value === undefined ? "" : value),
    z.string().trim().max(max),
  )

export const rsvpSchema = z.object({
  full_name: z
    .string({ invalid_type_error: "Please enter your name." })
    .trim()
    .min(1, "Please enter your name.")
    .max(RSVP_LIMITS.fullName, "That name is too long."),

  email: optionalText(RSVP_LIMITS.email).refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    "Please enter a valid email address.",
  ),

  phone: optionalText(RSVP_LIMITS.phone).refine(
    // Deliberately forgiving about formatting -- guests write numbers every
    // which way, and the length cap above is what actually bounds abuse. This
    // only catches a field that plainly is not a phone number.
    (value) => value === "" || (value.match(/[0-9]/g) ?? []).length >= 5,
    "Please enter a valid phone number.",
  ),

  attending: z.boolean().default(true),

  guest_count: z.coerce
    .number()
    .int()
    .min(0, "Please enter a valid number of guests.")
    .max(RSVP_LIMITS.guestCount, "Please contact us directly for a party that size.")
    .default(1),

  message: optionalText(RSVP_LIMITS.message),

  /**
   * Honeypot. Hidden from people, irresistible to form-filling bots. Anything
   * in here means the submission wasn't human.
   */
  website: optionalText(200).optional(),
})

export type RsvpInput = z.infer<typeof rsvpSchema>
