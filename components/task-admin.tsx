"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Calendar,
  Check,
  Circle,
  CircleCheck,
  ListTodo,
  Plus,
  Search,
  Trash2,
} from "lucide-react"

import { addTask, deleteTask, toggleTaskDone } from "@/app/task-list/actions"

// ----------------------------------------------------------------------------
// Types — mirror the columns selected in app/task-list/page.tsx
// ----------------------------------------------------------------------------
export type Priority = "low" | "medium" | "high"

export type Task = {
  id: string
  created_at: string
  title: string
  assignee: string | null
  priority: Priority
  due_date: string | null // "YYYY-MM-DD"
  event_type: string | null
  done: boolean
}

const EVENT_TYPES = [
  "General",
  "Mehendi",
  "Vidhi & Haldi (Tulsi's)",
  "Vidhi & Haldi (Vraj's)",
  "Sangeet",
  "Wedding Day",
]

const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

/** Formats a plain "YYYY-MM-DD" date string without a UTC/local timezone shift. */
function fmtDate(dateStr: string | null) {
  if (!dateStr) return "—"
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m || !d) return "—"
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------
export function TaskAdmin({
  tasks,
  loadError,
}: {
  tasks: Task[]
  loadError: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  const openCount = tasks.filter((t) => !t.done).length
  const doneCount = tasks.filter((t) => t.done).length
  const highOpenCount = tasks.filter((t) => !t.done && t.priority === "high").length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tasks
    return tasks.filter((t) =>
      [t.title, t.assignee, t.event_type]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q)),
    )
  }, [tasks, query])

  function onAddTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await addTask(formData)
      if (res.ok) {
        toast.success("Task added.")
        formRef.current?.reset()
      } else {
        toast.error(res.error)
      }
    })
  }

  function onToggleDone(id: string, done: boolean) {
    startTransition(async () => {
      const res = await toggleTaskDone(id, done)
      if (!res.ok) toast.error(res.error)
    })
  }

  function onDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    startTransition(async () => {
      const res = await deleteTask(id)
      res.ok ? toast.success("Task deleted.") : toast.error(res.error)
    })
  }

  return (
    <div className="admin-root">
      {/* Hero — same photo + cream styling as the other private pages */}
      <header className="hero">
        <div className="hero-img" aria-hidden="true" />
        <div className="wrap hero-inner">
          <p className="hero-kicker">~ Private · Hosts Only ~</p>
          <h1 className="hero-title">Wedding Task List</h1>
          <p className="hero-sub">
            Your private planning to-do list. Add tasks, assign who&apos;s
            handling them, set a priority and date, and tie each one to an
            event. This page is available only to approved hosts.
          </p>
          <div className="hero-meta">
            <span>Tulsi &amp; Vraj</span>
            <span className="dot" />
            <span>Private Dashboard</span>
            <span className="dot" />
            <span>Host access required</span>
          </div>
        </div>
      </header>

      {/* Sticky nav */}
      <nav className="subnav">
        <div className="wrap">
          <div className="subnav-row">
            <span className="subnav-brand">Task List</span>
            <a className="subnav-link" href="#overview">Overview</a>
            <a className="subnav-link" href="#add">Add Task</a>
            <a className="subnav-link" href="#tasks">Tasks</a>
          </div>
        </div>
      </nav>

      {loadError && (
        <div className="wrap" style={{ paddingTop: 24 }}>
          <div className="banner">Couldn&apos;t load data: {loadError}</div>
        </div>
      )}

      {/* Overview */}
      <section id="overview" className="sec">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker">At a Glance</span>
            <h2 className="sec-title">Where planning stands</h2>
          </div>
          <div className="stats">
            <Stat icon={<ListTodo size={18} />} label="Total tasks" value={tasks.length} />
            <Stat icon={<Circle size={18} />} label="Open" value={openCount} accent />
            <Stat icon={<CircleCheck size={18} />} label="Done" value={doneCount} />
            <Stat icon={<Calendar size={18} />} label="High priority open" value={highOpenCount} />
          </div>
        </div>
      </section>

      {/* Add task */}
      <section id="add" className="sec alt">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker">New To-Do</span>
            <h2 className="sec-title">Add a task</h2>
            <p className="sec-intro">
              Jot it down — who&apos;s doing it, how urgent it is, and which
              event it&apos;s for.
            </p>
          </div>

          <form ref={formRef} className="add-form" onSubmit={onAddTask}>
            <div className="add-grid">
              <input className="inp" name="title" placeholder="Task *" required />
              <input className="inp" name="assignee" placeholder="Person responsible" />
              <select className="inp" name="priority" defaultValue="medium">
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
              <input className="inp" name="due_date" type="date" />
              <select className="inp" name="event_type" defaultValue="General">
                {EVENT_TYPES.map((ev) => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
            </div>
            <button className="btn primary" type="submit" disabled={pending}>
              <Plus size={16} /> Add task
            </button>
          </form>
        </div>
      </section>

      {/* Tasks */}
      <section id="tasks" className="sec">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker">The List</span>
            <h2 className="sec-title">Tasks</h2>
          </div>

          <div className="toolbar">
            <div className="search">
              <Search size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks…"
                aria-label="Search tasks"
              />
            </div>
            <span className="count">{filtered.length} shown</span>
          </div>

          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Person responsible</th>
                  <th>Priority</th>
                  <th>Date</th>
                  <th>Event</th>
                  <th>Status</th>
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty">
                      {tasks.length === 0
                        ? "No tasks yet — add your first above."
                        : "No tasks match your search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className={t.done ? "is-done" : ""}>
                      <td className="strong">{t.title}</td>
                      <td className="dim">{t.assignee || "—"}</td>
                      <td>
                        <span className={`badge prio-${t.priority}`}>
                          {PRIORITY_LABEL[t.priority]}
                        </span>
                      </td>
                      <td className="dim nowrap">{fmtDate(t.due_date)}</td>
                      <td className="dim">{t.event_type || "—"}</td>
                      <td>
                        <button
                          type="button"
                          className={"status-btn" + (t.done ? " is-done" : "")}
                          title={t.done ? "Mark as open" : "Mark as done"}
                          onClick={() => onToggleDone(t.id, !t.done)}
                          disabled={pending}
                        >
                          {t.done ? <Check size={14} /> : <Circle size={14} />}
                          {t.done ? "Done" : "Open"}
                        </button>
                      </td>
                      <td className="num">
                        <button
                          className="icon-btn danger"
                          title="Delete task"
                          onClick={() => onDelete(t.id, t.title)}
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
            This page is available only to approved hosts.
            With love and aabhar —
          </p>
          <div className="sig">Tulsi &amp; Vraj</div>
          {/* Mirrors the Itinerary footer: a solid row of links closes the page
              off, and it doubles as navigation between the two private pages. */}
          <div className="foot-links">
            <Link href="/">Home</Link>
            <Link href="/guest-list">Guest List</Link>
          </div>
        </div>
      </footer>
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
