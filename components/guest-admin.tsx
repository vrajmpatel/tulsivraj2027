"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import {
  Users,
  ClipboardList,
  Check,
  X,
  Link2,
  Trash2,
  Pencil,
  Search,
  UserPlus,
  ChevronsUpDown,
  Download,
  Send,
} from "lucide-react"

import {
  addInvitee,
  updateInvitee,
  deleteInvitee,
  deleteRsvp,
  linkRsvp,
  setInvitationSent,
  setInviteeEvents,
} from "@/app/guest-list/actions"
import {
  INVITATION_SENT_OPTIONS,
  invitationSentLabel,
  type InvitationSent,
} from "@/lib/invitation"
import {
  WEDDING_EVENTS,
  eventLabels,
  normaliseEventIds,
  type WeddingEventId,
} from "@/lib/events"

// ----------------------------------------------------------------------------
// Types — mirror the columns selected in app/guest-list/page.tsx
// ----------------------------------------------------------------------------
export type Invitee = {
  id: string
  created_at: string
  full_name: string
  email: string | null
  phone: string | null
  side: string | null
  max_guests: number
  notes: string | null
  invitation_sent: InvitationSent
  events: WeddingEventId[]
}

export type Rsvp = {
  id: string
  created_at: string
  invitee_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  attending: boolean
  guest_count: number
  message: string | null
}

// How many invitee rows render at a time — more are revealed as the host
// scrolls the (fixed-height) invitees table, instead of the page growing.
const INVITEE_PAGE_SIZE = 20

// Sticky-nav sections — mirrors the scrollspy pill nav used on the
// Itinerary/Wardrobe Planner pages.
const NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "invitees", label: "Invitees" },
  { id: "rsvps", label: "RSVPs" },
] as const

// ----------------------------------------------------------------------------
// CSV export — Excel opens .csv natively, so this avoids pulling in a
// spreadsheet library just to produce a downloadable file.
// ----------------------------------------------------------------------------
function csvCell(value: string | number) {
  const s = String(value ?? "")
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")
  // Leading BOM so Excel reads UTF-8 (accented names, etc.) correctly.
  const BOM = String.fromCharCode(0xfeff)
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------
export function GuestAdmin({
  invitees,
  rsvps,
  loadError,
}: {
  invitees: Invitee[]
  rsvps: Rsvp[]
  loadError: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [inviteeQuery, setInviteeQuery] = useState("")
  const [rsvpQuery, setRsvpQuery] = useState("")
  const [editingInvitee, setEditingInvitee] = useState<Invitee | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Events the host has clicked but the server hasn't confirmed back yet,
  // keyed by invitee id. Drives what the checkboxes render, so clicking stays
  // responsive and a fast second click builds on the first.
  const [eventOverrides, setEventOverrides] = useState<
    Record<string, WeddingEventId[]>
  >({})

  // Sticky-nav scrollspy — highlights the pill for the section in view,
  // same behavior as the Itinerary/Wardrobe Planner subnav.
  const [activeSection, setActiveSection] = useState<string>(NAV_SECTIONS[0].id)

  useEffect(() => {
    const root = document.querySelector(".admin-root")
    if (!root) return
    const sections = Array.from(root.querySelectorAll<HTMLElement>("section[id]"))
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection((e.target as HTMLElement).id)
        })
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    )
    sections.forEach((s) => spy.observe(s))
    return () => spy.disconnect()
  }, [])

  function jumpToSection(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  // Invitees table keeps a fixed height and reveals more rows as the host
  // scrolls, instead of letting the page grow forever as guests are added.
  const [visibleInviteeCount, setVisibleInviteeCount] = useState(INVITEE_PAGE_SIZE)
  const inviteesScrollRef = useRef<HTMLDivElement>(null)
  const inviteesSentinelRef = useRef<HTMLDivElement>(null)

  const inviteeById = useMemo(
    () => new Map(invitees.map((i) => [i.id, i])),
    [invitees],
  )

  // Once the server sends back a row matching what we optimistically showed,
  // drop the override so the server is the single source of truth again.
  useEffect(() => {
    setEventOverrides((prev) => {
      let changed = false
      const next = { ...prev }
      for (const i of invitees) {
        const pending = next[i.id]
        if (pending && pending.join(",") === i.events.join(",")) {
          delete next[i.id]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [invitees])

  // How many RSVPs are linked to each invitee — drives the "responded" badge.
  const rsvpCountByInvitee = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rsvps) {
      if (r.invitee_id) m.set(r.invitee_id, (m.get(r.invitee_id) ?? 0) + 1)
    }
    return m
  }, [rsvps])

  const attendingCount = rsvps.filter((r) => r.attending).length
  const decliningCount = rsvps.filter((r) => !r.attending).length
  const expectedHeads = rsvps
    .filter((r) => r.attending)
    .reduce((sum, r) => sum + (r.guest_count || 0), 0)
  const unmatchedCount = rsvps.filter((r) => !r.invitee_id).length
  const sentInviteesCount = invitees.filter((i) => i.invitation_sent !== "not_yet").length
  const sentPct = invitees.length > 0 ? Math.round((sentInviteesCount / invitees.length) * 100) : 0

  const respondedSentCount = invitees.filter(
    (i) => i.invitation_sent !== "not_yet" && (rsvpCountByInvitee.get(i.id) ?? 0) > 0,
  ).length
  const respondedPct =
    sentInviteesCount > 0 ? Math.round((respondedSentCount / sentInviteesCount) * 100) : 0

  const filteredInvitees = useMemo(() => {
    const q = inviteeQuery.trim().toLowerCase()
    if (!q) return invitees
    return invitees.filter((i) =>
      [
        i.full_name, i.email, i.phone, i.side, i.notes,
        invitationSentLabel(i.invitation_sent),
        eventLabels(i.events).join(" "),
      ]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q)),
    )
  }, [invitees, inviteeQuery])

  // Reset how many rows are revealed whenever the search narrows the list.
  useEffect(() => {
    setVisibleInviteeCount(INVITEE_PAGE_SIZE)
  }, [inviteeQuery])

  const visibleInvitees = filteredInvitees.slice(0, visibleInviteeCount)
  const hasMoreInvitees = visibleInviteeCount < filteredInvitees.length

  // Infinite scroll: reveal the next batch once the sentinel at the bottom
  // of the (fixed-height, scrollable) invitees table comes into view. Keyed
  // on visibleInviteeCount so the observer is torn down and re-created after
  // every batch — otherwise a sentinel that's still on-screen post-load (the
  // fixed-height box wasn't full yet) never re-fires, since IntersectionObserver
  // only reports threshold *crossings*, not "still intersecting."
  useEffect(() => {
    const sentinel = inviteesSentinelRef.current
    const root = inviteesScrollRef.current
    if (!sentinel || !root || !hasMoreInvitees) return

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleInviteeCount((c) => Math.min(c + INVITEE_PAGE_SIZE, filteredInvitees.length))
        }
      },
      { root, rootMargin: "200px" },
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [visibleInviteeCount, hasMoreInvitees, filteredInvitees.length])

  const filteredRsvps = useMemo(() => {
    const q = rsvpQuery.trim().toLowerCase()
    if (!q) return rsvps
    return rsvps.filter((r) =>
      [r.full_name, r.email, r.phone, r.message]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q)),
    )
  }, [rsvps, rsvpQuery])

  // ---- Mutations ------------------------------------------------------------
  function onAddInvitee(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const res = await addInvitee(formData)
        if (res.ok) {
          toast.success("Invitee added.")
          formRef.current?.reset()
        } else if (res.duplicateOf) {
          // Deliberately not resetting the form — whatever was typed stays put so
          // it can be corrected rather than re-entered.
          toast.error("Already on the guest list", {
            description: res.error,
            duration: 8000,
          })
        } else {
          toast.error(res.error || "Could not add invitee.")
        }
      } catch (err: any) {
        console.error("onAddInvitee error:", err)
        toast.error(err?.message || "An unexpected error occurred while adding invitee.")
      }
    })
  }

  function onEditInvitee(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingInvitee) return
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const res = await updateInvitee(editingInvitee.id, formData)
        if (res.ok) {
          toast.success("Invitee updated.")
          setEditingInvitee(null)
        } else if (res.duplicateOf) {
          // Modal stays open so the clash can be corrected in place.
          toast.error("Already on the guest list", {
            description: res.error,
            duration: 8000,
          })
        } else {
          toast.error(res.error || "Could not update invitee.")
        }
      } catch (err: any) {
        console.error("onEditInvitee error:", err)
        toast.error(err?.message || "An unexpected error occurred while updating invitee.")
      }
    })
  }

  function onDeleteInvitee(id: string, name: string) {
    if (!confirm(`Remove "${name}" from the guest list?`)) return
    startTransition(async () => {
      try {
        const res = await deleteInvitee(id)
        res.ok ? toast.success("Invitee removed.") : toast.error(res.error || "Could not remove invitee.")
      } catch (err: any) {
        console.error("onDeleteInvitee error:", err)
        toast.error(err?.message || "An unexpected error occurred while removing invitee.")
      }
    })
  }

  function onSetInvitationSent(id: string, value: InvitationSent) {
    startTransition(async () => {
      try {
        const res = await setInvitationSent(id, value)
        if (res.ok) toast.success(`Invitation marked "${invitationSentLabel(value)}".`)
        else toast.error(res.error || "Could not update invitation status.")
      } catch (err: any) {
        console.error("onSetInvitationSent error:", err)
        toast.error(err?.message || "An unexpected error occurred.")
      }
    })
  }

  /**
   * Toggling one event sends the whole resulting list, so a burst of clicks
   * can't interleave into a half-applied state on the server.
   *
   * The pending value is also held locally. Without it, a second click landing
   * before the first round-trip returns would compute its new list from the
   * stale `invitee.events` prop and silently undo the first change.
   */
  function onToggleEvent(invitee: Invitee, eventId: WeddingEventId, on: boolean) {
    const current = eventOverrides[invitee.id] ?? invitee.events
    const next = on
      ? normaliseEventIds([...current, eventId])
      : current.filter((e) => e !== eventId)

    setEventOverrides((prev) => ({ ...prev, [invitee.id]: next }))

    startTransition(async () => {
      try {
        const res = await setInviteeEvents(invitee.id, next)
        if (!res.ok) {
          toast.error(res.error || "Could not update events.")
          // Put the row back to whatever the server last told us.
          setEventOverrides((prev) => {
            const copy = { ...prev }
            delete copy[invitee.id]
            return copy
          })
        }
      } catch (err: any) {
        console.error("onToggleEvent error:", err)
        toast.error(err?.message || "An unexpected error occurred.")
        setEventOverrides((prev) => {
          const copy = { ...prev }
          delete copy[invitee.id]
          return copy
        })
      }
    })
  }

  function onLink(rsvpId: string, inviteeId: string) {
    startTransition(async () => {
      try {
        const res = await linkRsvp(rsvpId, inviteeId)
        if (res.ok) toast.success(inviteeId ? "RSVP linked." : "RSVP unlinked.")
        else toast.error(res.error || "Could not link RSVP.")
      } catch (err: any) {
        console.error("onLink error:", err)
        toast.error(err?.message || "An unexpected error occurred.")
      }
    })
  }

  function onDeleteRsvp(id: string, name: string) {
    if (!confirm(`Delete the RSVP from "${name}"? This cannot be undone.`)) return
    startTransition(async () => {
      try {
        const res = await deleteRsvp(id)
        res.ok ? toast.success("RSVP deleted.") : toast.error(res.error || "Could not delete RSVP.")
      } catch (err: any) {
        console.error("onDeleteRsvp error:", err)
        toast.error(err?.message || "An unexpected error occurred.")
      }
    })
  }

  function onExportInvitees() {
    const rows = filteredInvitees.map((i) => {
      const responses = rsvpCountByInvitee.get(i.id) ?? 0
      return [
        i.full_name,
        i.email ?? "",
        i.phone ?? "",
        i.side ?? "",
        i.max_guests,
        invitationSentLabel(i.invitation_sent),
        eventLabels(i.events).join(", "),
        // A column per event as well as the joined summary above. The joined
        // cell reads well for a human scanning the sheet, but can't be filtered
        // or counted -- and "who's coming to the Sangeet?" is the question this
        // export actually gets used for.
        ...WEDDING_EVENTS.map((ev) => (i.events.includes(ev.id) ? "Yes" : "")),
        i.events.length,
        responses > 0 ? `Responded${responses > 1 ? ` x${responses}` : ""}` : "Awaiting",
        i.notes ?? "",
        fmtDate(i.created_at),
      ]
    })
    downloadCsv(
      `guest-list-invitees-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Name",
        "Email",
        "Phone",
        "Side",
        "Max Guests",
        "Invitation Sent",
        "Events",
        ...WEDDING_EVENTS.map((ev) => ev.label),
        "Events Count",
        "Status",
        "Notes",
        "Added",
      ],
      rows,
    )
  }

  function onExportRsvps() {
    const rows = filteredRsvps.map((r) => [
      r.full_name,
      r.email ?? "",
      r.phone ?? "",
      r.attending ? "Yes" : "No",
      r.attending ? r.guest_count : "",
      r.message ?? "",
      fmtDate(r.created_at),
      r.invitee_id ? (inviteeById.get(r.invitee_id)?.full_name ?? "") : "Not matched",
    ])
    downloadCsv(
      `guest-list-rsvps-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Name", "Email", "Phone", "Attending", "Guests", "Message", "Received", "Matched Invitee"],
      rows,
    )
  }

  return (
    <div className="admin-root">
      {/* Hero — same photo + cream styling as the other pages */}
      <header className="hero">
        <div className="hero-img" aria-hidden="true" />
        <div className="wrap hero-inner">
          <p className="hero-kicker">~ Private · Hosts Only ~</p>
          <h1 className="hero-title">Guest List &amp; RSVPs</h1>
        </div>
      </header>

      {/* Sticky nav */}
      <nav className="subnav">
        <div className="wrap">
          <div className="subnav-row">
            <span className="subnav-brand">Sections</span>
            {NAV_SECTIONS.map((s) => (
              <a
                key={s.id}
                className={"subnav-link" + (activeSection === s.id ? " is-active" : "")}
                href={`#${s.id}`}
                onClick={(e) => jumpToSection(e, s.id)}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {loadError && (
        <div className="wrap" style={{ paddingTop: 24 }}>
          <div className="banner">
            Couldn&apos;t load data: {loadError}
          </div>
        </div>
      )}

      {/* Overview */}
      <section id="overview" className="sec">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker">At a Glance</span>
          </div>
          <div className="stats">
            <Stat icon={<Users size={18} />} label="Invitees" value={invitees.length} />
            <Stat icon={<ClipboardList size={18} />} label="RSVPs received" value={rsvps.length} />
            <Stat icon={<Check size={18} />} label="Attending" value={attendingCount} accent />
            <Stat icon={<X size={18} />} label="Declined" value={decliningCount} />
            <Stat icon={<Users size={18} />} label="Heads expected" value={expectedHeads} />
            <Stat icon={<Link2 size={18} />} label="RSVPs not matched" value={unmatchedCount} />
          </div>

          <div className="progress-grid">
            <div className="progress-card">
              <div className="progress-header">
                <div className="progress-title">
                  <Send size={16} />
                  <span>Invitations Sent</span>
                </div>
                <div className="progress-stats">
                  <strong>{sentInviteesCount}</strong> / {invitees.length}{" "}
                  <span className="progress-pct">({sentPct}%)</span>
                </div>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuenow={sentPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Invitations sent progress"
              >
                <div className="progress-fill" style={{ width: `${sentPct}%` }} />
              </div>
              <p className="progress-sub">
                {sentInviteesCount} out of {invitees.length} recorded invitees sent
              </p>
            </div>

            <div className="progress-card">
              <div className="progress-header">
                <div className="progress-title">
                  <ClipboardList size={16} />
                  <span>RSVP Responses</span>
                </div>
                <div className="progress-stats">
                  <strong>{respondedSentCount}</strong> / {sentInviteesCount}{" "}
                  <span className="progress-pct">({respondedPct}%)</span>
                </div>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuenow={respondedPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="RSVP responses progress"
              >
                <div className="progress-fill alt" style={{ width: `${respondedPct}%` }} />
              </div>
              <p className="progress-sub">
                {respondedSentCount} out of {sentInviteesCount} invited guests responded
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Invitees */}
      <section id="invitees" className="sec alt">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker">Guest List</span>
            <h2 className="sec-title">Invitees</h2>
            <p className="sec-intro">
              The people you&apos;ve invited. Add them here so you can match
              incoming RSVPs against the list.
            </p>
          </div>

          {/* Add form */}
          <form ref={formRef} className="add-form" onSubmit={onAddInvitee}>
            <div className="add-grid">
              <input className="inp" name="full_name" placeholder="Full name *" required />
              <input className="inp" name="email" type="email" placeholder="Email" />
              <input className="inp" name="phone" placeholder="Phone" />
              <select className="inp" name="side" defaultValue="" aria-label="Side">
                <option value="" disabled>
                  Side
                </option>
                <option value="tulsi">Tulsi</option>
                <option value="vraj">Vraj</option>
              </select>
              <input className="inp" name="max_guests" type="number" min={1} defaultValue={1} placeholder="Max guests" />
              <input className="inp" name="notes" placeholder="Notes" />
            </div>
            <button className="btn primary" type="submit" disabled={pending}>
              <UserPlus size={16} /> Add invitee
            </button>
          </form>

          <div className="toolbar">
            <div className="search">
              <Search size={15} />
              <input
                value={inviteeQuery}
                onChange={(e) => setInviteeQuery(e.target.value)}
                placeholder="Search invitees…"
                aria-label="Search invitees"
              />
            </div>
            <div className="toolbar-actions">
              <button className="btn" type="button" onClick={onExportInvitees}>
                <Download size={14} /> Export to Excel
              </button>
              <span className="count">{filteredInvitees.length} shown</span>
            </div>
          </div>

          <div className="tbl-wrap tbl-wrap-scroll" ref={inviteesScrollRef}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Side</th>
                  <th className="num">Max</th>
                  <th>Invitation Sent?</th>
                  <th>Events</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvitees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty">
                      {invitees.length === 0
                        ? "No invitees yet — add your first above."
                        : "No invitees match your search."}
                    </td>
                  </tr>
                ) : (
                  visibleInvitees.map((i) => {
                    const responses = rsvpCountByInvitee.get(i.id) ?? 0
                    return (
                      <tr key={i.id}>
                        <td className="strong">{i.full_name}</td>
                        <td className="dim">
                          {i.email && <div>{i.email}</div>}
                          {i.phone && <div>{i.phone}</div>}
                          {!i.email && !i.phone && "—"}
                        </td>
                        <td className="dim">{i.side || "—"}</td>
                        <td className="num">{i.max_guests}</td>
                        <td>
                          <InvitationSentRadio
                            invitee={i}
                            pending={pending}
                            onChange={(value) => onSetInvitationSent(i.id, value)}
                          />
                        </td>
                        <td>
                          <InviteeEventsCheckboxes
                            invitee={i}
                            events={eventOverrides[i.id] ?? i.events}
                            onToggle={(eventId, on) => onToggleEvent(i, eventId, on)}
                          />
                        </td>
                        <td>
                          {responses > 0 ? (
                            <span className="badge yes">
                              Responded{responses > 1 ? ` ×${responses}` : ""}
                            </span>
                          ) : (
                            <span className="badge muted">Awaiting</span>
                          )}
                        </td>
                        <td className="dim notes">{i.notes || "—"}</td>
                        <td className="num">
                          <div className="row-actions">
                            <button
                              className="icon-btn"
                              title="Edit invitee"
                              onClick={() => setEditingInvitee(i)}
                              disabled={pending}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="icon-btn danger"
                              title="Remove invitee"
                              onClick={() => onDeleteInvitee(i.id, i.full_name)}
                              disabled={pending}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
            {hasMoreInvitees && <div ref={inviteesSentinelRef} className="load-sentinel" aria-hidden="true" />}
          </div>
        </div>
      </section>

      {/* RSVPs */}
      <section id="rsvps" className="sec">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker">Responses</span>
            <h2 className="sec-title">RSVPs</h2>
            <p className="sec-intro">
              Everyone who has filled out the form. Use the dropdown to connect
              each response to the matching invitee.
            </p>
          </div>

          <div className="toolbar">
            <div className="search">
              <Search size={15} />
              <input
                value={rsvpQuery}
                onChange={(e) => setRsvpQuery(e.target.value)}
                placeholder="Search RSVPs…"
                aria-label="Search RSVPs"
              />
            </div>
            <div className="toolbar-actions">
              <button className="btn" type="button" onClick={onExportRsvps}>
                <Download size={14} /> Export to Excel
              </button>
              <span className="count">{filteredRsvps.length} shown</span>
            </div>
          </div>

          <div className="tbl-wrap tbl-wrap-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Attending</th>
                  <th className="num">Guests</th>
                  <th>Message</th>
                  <th>Received</th>
                  <th>Matched invitee</th>
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRsvps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty">
                      {rsvps.length === 0
                        ? "No RSVPs yet."
                        : "No RSVPs match your search."}
                    </td>
                  </tr>
                ) : (
                  filteredRsvps.map((r) => (
                    <tr key={r.id} className={r.invitee_id ? "" : "is-unmatched"}>
                      <td className="strong">{r.full_name}</td>
                      <td className="dim">
                        {r.email && <div>{r.email}</div>}
                        {r.phone && <div>{r.phone}</div>}
                        {!r.email && !r.phone && "—"}
                      </td>
                      <td>
                        {r.attending ? (
                          <span className="badge yes">Yes</span>
                        ) : (
                          <span className="badge no">No</span>
                        )}
                      </td>
                      <td className="num">{r.attending ? r.guest_count : "—"}</td>
                      <td className="dim notes">{r.message || "—"}</td>
                      <td className="dim nowrap">{fmtDate(r.created_at)}</td>
                      <td>
                        <InviteeCombobox
                          invitees={invitees}
                          value={r.invitee_id ?? ""}
                          onChange={(id) => onLink(r.id, id)}
                          disabled={pending}
                        />
                      </td>
                      <td className="num">
                        <button
                          className="icon-btn danger"
                          title="Delete RSVP"
                          onClick={() => onDeleteRsvp(r.id, r.full_name)}
                          disabled={pending}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>


      {editingInvitee && (
        <EditInviteeModal
          invitee={editingInvitee}
          pending={pending}
          onSubmit={onEditInvitee}
          onClose={() => setEditingInvitee(null)}
        />
      )}
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div className={"stat" + (accent ? " is-key" : "")}>
      <div className="stat-top">
        {icon}
        <span>{label}</span>
      </div>
      <div className="stat-val">{value}</div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// "Invitation Sent?" radio group — one per invitee row.
//
// Real <input type="radio"> elements (visually hidden, styled through their
// labels) rather than buttons, so arrow keys move between the options and
// screen readers announce it as one grouped choice. Each row needs its own
// `name`, otherwise every row on the page would share a single group and
// selecting one would clear the rest.
// ----------------------------------------------------------------------------
function InvitationSentRadio({
  invitee,
  pending,
  onChange,
}: {
  invitee: Invitee
  pending: boolean
  onChange: (value: InvitationSent) => void
}) {
  return (
    <fieldset className="sent-group" disabled={pending}>
      <legend className="sent-legend">Invitation sent to {invitee.full_name}</legend>
      {INVITATION_SENT_OPTIONS.map((opt) => {
        const checked = invitee.invitation_sent === opt.value
        return (
          <label
            key={opt.value}
            className={`sent-opt is-${opt.value}` + (checked ? " is-active" : "")}
          >
            <input
              type="radio"
              name={`invitation-sent-${invitee.id}`}
              value={opt.value}
              checked={checked}
              disabled={pending}
              onChange={() => onChange(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        )
      })}
    </fieldset>
  )
}

// ----------------------------------------------------------------------------
// "Events" checkboxes — one per invitee row.
//
// Checkboxes rather than radios because a household is routinely invited to
// some events but not all. Styled as the same pills as the Invitation Sent
// group, but each toggles independently. The group wraps onto a second line so
// five options don't stretch the table into a long horizontal scroll.
// ----------------------------------------------------------------------------
function InviteeEventsCheckboxes({
  invitee,
  events,
  onToggle,
}: {
  invitee: Invitee
  /** Effective selection — the optimistic value while a save is in flight. */
  events: WeddingEventId[]
  onToggle: (eventId: WeddingEventId, on: boolean) => void
}) {
  // Deliberately not disabled while a save is in flight, unlike the single
  // -select radios above: setting five events on a row means five clicks in a
  // row, and greying out between each would make that crawl. The optimistic
  // tick is the feedback, and the overlay keeps fast clicks correct.
  return (
    <fieldset className="events-group">
      <legend className="sent-legend">Events for {invitee.full_name}</legend>
      {WEDDING_EVENTS.map((ev) => {
        const checked = events.includes(ev.id)
        return (
          <label
            key={ev.id}
            className={"events-opt" + (checked ? " is-active" : "")}
            title={ev.label}
          >
            <input
              type="checkbox"
              name={`events-${invitee.id}`}
              value={ev.id}
              checked={checked}
              onChange={(e) => onToggle(ev.id, e.target.checked)}
            />
            <span>{ev.short}</span>
          </label>
        )
      })}
    </fieldset>
  )
}

// ----------------------------------------------------------------------------
// Edit invitee popup. Rendered in a portal so it sits above everything else,
// including the table's scroll container.
// ----------------------------------------------------------------------------
function EditInviteeModal({
  invitee,
  pending,
  onSubmit,
  onClose,
}: {
  invitee: Invitee
  pending: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  if (typeof document === "undefined") return null

  return createPortal(
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${invitee.full_name}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>Edit invitee</h3>
          <button
            className="icon-btn"
            title="Close"
            onClick={onClose}
            disabled={pending}
          >
            <X size={16} />
          </button>
        </div>
        <form className="modal-form" onSubmit={onSubmit}>
          <label className="modal-field">
            <span>Full name *</span>
            <input
              className="inp"
              name="full_name"
              defaultValue={invitee.full_name}
              required
            />
          </label>
          <label className="modal-field">
            <span>Email</span>
            <input
              className="inp"
              name="email"
              type="email"
              defaultValue={invitee.email ?? ""}
            />
          </label>
          <label className="modal-field">
            <span>Phone</span>
            <input className="inp" name="phone" defaultValue={invitee.phone ?? ""} />
          </label>
          <label className="modal-field">
            <span>Side</span>
            <select className="inp" name="side" defaultValue={invitee.side ?? ""}>
              <option value="" disabled>
                Side
              </option>
              <option value="tulsi">Tulsi</option>
              <option value="vraj">Vraj</option>
            </select>
          </label>
          <label className="modal-field">
            <span>Max guests</span>
            <input
              className="inp"
              name="max_guests"
              type="number"
              min={1}
              defaultValue={invitee.max_guests}
            />
          </label>
          <label className="modal-field">
            <span>Invitation sent?</span>
            <select
              className="inp"
              name="invitation_sent"
              defaultValue={invitee.invitation_sent}
            >
              {INVITATION_SENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="modal-field">
            <span>Events</span>
            {/* Tells the action the form really did submit this field, so
                unticking everything saves as "no events" rather than reading
                as "field absent, leave unchanged". */}
            <input type="hidden" name="events_present" value="1" />
            <div className="events-group is-modal">
              {WEDDING_EVENTS.map((ev) => (
                <label
                  key={ev.id}
                  className="events-opt"
                  title={ev.label}
                >
                  <input
                    type="checkbox"
                    name="events"
                    value={ev.id}
                    defaultChecked={invitee.events.includes(ev.id)}
                  />
                  <span>{ev.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="modal-field">
            <span>Notes</span>
            <input className="inp" name="notes" defaultValue={invitee.notes ?? ""} />
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </button>
            <button className="btn primary" type="submit" disabled={pending}>
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

// ----------------------------------------------------------------------------
// Searchable invitee picker. Type to filter by name; the panel is rendered in
// a portal with fixed positioning so it's never clipped by the table's scroll
// container. Selecting clears or sets rsvp.invitee_id.
// ----------------------------------------------------------------------------
function InviteeCombobox({
  invitees,
  value,
  onChange,
  disabled,
}: {
  invitees: Invitee[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const [coords, setCoords] = useState<{ left: number; top: number; width: number; openUp: boolean } | null>(null)

  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = invitees.find((i) => i.id === value) ?? null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return invitees
    return invitees.filter((i) => i.full_name.toLowerCase().includes(q))
  }, [invitees, query])

  function place() {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const popHeight = 280
    const spaceBelow = window.innerHeight - r.bottom
    const openUp = spaceBelow < popHeight && r.top > spaceBelow
    setCoords({
      left: r.left,
      top: openUp ? r.top - 4 : r.bottom + 4,
      width: Math.max(r.width, 240),
      openUp,
    })
  }

  function toggle() {
    if (disabled) return
    if (open) {
      setOpen(false)
    } else {
      place()
      setQuery("")
      setActive(0)
      setOpen(true)
    }
  }

  function choose(id: string) {
    onChange(id)
    setOpen(false)
  }

  // Keep the panel anchored while open; close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => inputRef.current?.focus())

    const reposition = () => place()
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const pick = filtered[active]
      if (pick) choose(pick.id)
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={"combo-btn" + (selected ? "" : " is-empty")}
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="combo-val">{selected ? selected.full_name : "— Not matched —"}</span>
        <ChevronsUpDown size={14} />
      </button>

      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popRef}
            className={"invitee-combo-pop" + (coords.openUp ? " is-open-up" : "")}
            style={{
              left: coords.left,
              top: coords.top,
              width: coords.width,
              transform: coords.openUp ? "translateY(-100%)" : undefined,
            }}
          >
            <div className="combo-search">
              <Search size={14} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Search by name…"
              />
            </div>
            <ul className="combo-list" role="listbox">
              <li
                role="option"
                aria-selected={!value}
                className={"combo-opt is-clear" + (!value ? " is-selected" : "")}
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose("")
                }}
              >
                — Not matched —
                {!value && <Check size={14} />}
              </li>
              {filtered.length === 0 ? (
                <li className="combo-empty">No invitees found.</li>
              ) : (
                filtered.map((i, idx) => (
                  <li
                    key={i.id}
                    role="option"
                    aria-selected={i.id === value}
                    className={
                      "combo-opt" +
                      (idx === active ? " is-active" : "") +
                      (i.id === value ? " is-selected" : "")
                    }
                    onMouseEnter={() => setActive(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      choose(i.id)
                    }}
                  >
                    <span className="combo-name">{i.full_name}</span>
                    {i.side && <span className="combo-side">{i.side}</span>}
                    {i.id === value && <Check size={14} />}
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )}
    </>
  )
}
