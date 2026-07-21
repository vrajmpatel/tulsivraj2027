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
} from "lucide-react"

import {
  addInvitee,
  updateInvitee,
  deleteInvitee,
  deleteRsvp,
  linkRsvp,
} from "@/app/guest-list/actions"

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

  const inviteeById = useMemo(
    () => new Map(invitees.map((i) => [i.id, i])),
    [invitees],
  )

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

  const filteredInvitees = useMemo(() => {
    const q = inviteeQuery.trim().toLowerCase()
    if (!q) return invitees
    return invitees.filter((i) =>
      [i.full_name, i.email, i.phone, i.side, i.notes]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q)),
    )
  }, [invitees, inviteeQuery])

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
      const res = await addInvitee(formData)
      if (res.ok) {
        toast.success("Invitee added.")
        formRef.current?.reset()
      } else {
        toast.error(res.error)
      }
    })
  }

  function onEditInvitee(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingInvitee) return
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateInvitee(editingInvitee.id, formData)
      if (res.ok) {
        toast.success("Invitee updated.")
        setEditingInvitee(null)
      } else {
        toast.error(res.error)
      }
    })
  }

  function onDeleteInvitee(id: string, name: string) {
    if (!confirm(`Remove "${name}" from the guest list?`)) return
    startTransition(async () => {
      const res = await deleteInvitee(id)
      res.ok ? toast.success("Invitee removed.") : toast.error(res.error)
    })
  }

  function onLink(rsvpId: string, inviteeId: string) {
    startTransition(async () => {
      const res = await linkRsvp(rsvpId, inviteeId)
      if (res.ok) toast.success(inviteeId ? "RSVP linked." : "RSVP unlinked.")
      else toast.error(res.error)
    })
  }

  function onDeleteRsvp(id: string, name: string) {
    if (!confirm(`Delete the RSVP from "${name}"? This cannot be undone.`)) return
    startTransition(async () => {
      const res = await deleteRsvp(id)
      res.ok ? toast.success("RSVP deleted.") : toast.error(res.error)
    })
  }

  return (
    <div className="admin-root">
      {/* Hero — same photo + cream styling as the other pages */}
      <header className="hero">
        <div className="hero-img" aria-hidden="true" />
        <div className="wrap hero-inner">
          <p className="hero-kicker">~ Private · Hosts Only ~</p>
          <h1 className="hero-title">Guest List &amp; RSVPs</h1>
          <p className="hero-sub">
            Your private dashboard. Track who&apos;s been invited, see who has
            responded, and match each RSVP to the right invitee. This page is
            unlisted — only people with the link can reach it.
          </p>
          <div className="hero-meta">
            <span>Tulsi &amp; Vraj</span>
            <span className="dot" />
            <span>Private Dashboard</span>
            <span className="dot" />
            <span>Unlisted</span>
          </div>
        </div>
      </header>

      {/* Sticky nav */}
      <nav className="subnav">
        <div className="wrap">
          <div className="subnav-row">
            <span className="subnav-brand">Guest List</span>
            <a className="subnav-link" href="#overview">Overview</a>
            <a className="subnav-link" href="#invitees">Invitees</a>
            <a className="subnav-link" href="#rsvps">RSVPs</a>
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
            <h2 className="sec-title">Where things stand</h2>
          </div>
          <div className="stats">
            <Stat icon={<Users size={18} />} label="Invitees" value={invitees.length} />
            <Stat icon={<ClipboardList size={18} />} label="RSVPs received" value={rsvps.length} />
            <Stat icon={<Check size={18} />} label="Attending" value={attendingCount} accent />
            <Stat icon={<X size={18} />} label="Declined" value={decliningCount} />
            <Stat icon={<Users size={18} />} label="Heads expected" value={expectedHeads} />
            <Stat icon={<Link2 size={18} />} label="RSVPs not matched" value={unmatchedCount} />
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
            <span className="count">{filteredInvitees.length} shown</span>
          </div>

          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Side</th>
                  <th className="num">Max</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvitees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty">
                      {invitees.length === 0
                        ? "No invitees yet — add your first above."
                        : "No invitees match your search."}
                    </td>
                  </tr>
                ) : (
                  filteredInvitees.map((i) => {
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
            <span className="count">{filteredRsvps.length} shown</span>
          </div>

          <div className="tbl-wrap">
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

      <footer className="foot">
        <div className="foot-tex" aria-hidden="true" />
        <div className="wrap foot-inner">
          <div className="flo">❀ ❀ ❀</div>
          <h3>Keep this link to yourself</h3>
          <p>
            This page is unlisted — only people with the link can reach it. With
            love and aabhar —
          </p>
          <div className="sig">Tulsi &amp; Vraj</div>
        </div>
      </footer>

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
  const [coords, setCoords] = useState<{ left: number; top: number; width: number } | null>(null)

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
    setCoords({ left: r.left, top: r.bottom + 4, width: Math.max(r.width, 240) })
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
            className="invitee-combo-pop"
            style={{ left: coords.left, top: coords.top, width: coords.width }}
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
