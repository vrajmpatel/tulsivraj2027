/**
 * The wedding events, in the order they happen.
 *
 * Single source of truth: the Itinerary page renders its section nav from this,
 * and the guest list uses it for the per-household "Events" column. Renaming an
 * event here updates both, so the two can never drift apart.
 *
 * `id` is what's stored in the database (`invitee.events`), so changing an id
 * means migrating existing rows -- change `label` freely, ids rarely.
 */
export const WEDDING_EVENTS = [
  { id: "mehendi", label: "Mehendi", short: "Mehendi", day: "02" },
  { id: "haldi-tulsi", label: "Tulsi's Haldi", short: "T. Haldi", day: "03" },
  { id: "haldi-vraj", label: "Vraj's Haldi", short: "V. Haldi", day: "04" },
  { id: "sangeet", label: "Sangeet", short: "Sangeet", day: "04" },
  { id: "lagna", label: "Lagna", short: "Lagna", day: "05" },
] as const

export type WeddingEventId = (typeof WEDDING_EVENTS)[number]["id"]

export const EVENT_IDS = WEDDING_EVENTS.map((e) => e.id) as readonly WeddingEventId[]

export function isWeddingEventId(value: unknown): value is WeddingEventId {
  return typeof value === "string" && (EVENT_IDS as readonly string[]).includes(value)
}

/**
 * Keep only valid ids, drop duplicates, and return them in itinerary order --
 * so a stored array always reads the same way regardless of click order.
 */
export function normaliseEventIds(values: readonly unknown[]): WeddingEventId[] {
  return EVENT_IDS.filter((id) => values.includes(id))
}

/** Full labels, in itinerary order. Used for the CSV export and search. */
export function eventLabels(values: readonly string[]) {
  return WEDDING_EVENTS.filter((e) => values.includes(e.id)).map((e) => e.label)
}
