"use client"

import { useEffect, useRef, useState, type MouseEvent } from "react"
import Link from "next/link"
import { ArrowUp, MapPin } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// ----------------------------------------------------------------------------
// Content — distilled from the claude.ai/design handoff (project/Itinerary.html),
// itself built from the couple's wedding itinerary document. A warm,
// guest-facing timeline of the wedding week (Jan 2–5, 2027 · Vadodara): one
// section per event, mirroring the Wardrobe Planner's event list, with the
// wedding day itself condensed into the Lagna section.
// ----------------------------------------------------------------------------

const SECTIONS = [
  { id: "mehendi", label: "Mehendi", day: "02" },
  { id: "haldi-tulsi", label: "Tulsi's Haldi", day: "03" },
  { id: "haldi-vraj", label: "Vraj's Haldi", day: "04" },
  { id: "sangeet", label: "Sangeet", day: "04" },
  { id: "lagna", label: "Lagna", day: "05" },
] as const

// Every event this week is held at the same venue, except the Sangeet.
const VENUE = {
  name: "Aambaug, Vadodara",
  address: "834R+XR8, Ampad, Vadodara, Gujarat 391101, India",
  mapsUrl: "https://maps.app.goo.gl/fQaPZkFKYjZtpaLAA",
}

const SANGEET_VENUE = {
  name: "Suncity Club & Resort",
  address: "Next to Chandan Multiplex, Gotri-Sherkhi Road, Vadodara, Gujarat 391330, India",
  mapsUrl: "https://maps.app.goo.gl/8j15FuUyTndy8Err7",
}

type TLRow = {
  t: string
  ap: string
  first?: boolean
  last?: boolean
  sun?: boolean
  keyCard?: boolean
  tag: string
  title?: string
  desc?: string
  span?: string
}

// The Lagna schedule, split where the "gather & settle in" pause falls —
// arrival through the varmala, then the ceremony onward.
const LAGNA_OPENING: TLRow[] = [
  {
    t: "4:00", ap: "PM", first: true,
    tag: "Welcome & Hi-Tea", title: "Guest arrival",
    desc: "Make your way to Aambaug and enjoy tea and snacks as the baraat gathers and the evening begins.",
  },
  {
    t: "5:00", ap: "PM",
    tag: "Groom's Procession", title: "The Baraat",
    desc: "Vraj sets off in a lively procession to the beat of the dhol and the DJ. Family and friends dance their way to the venue — please join the celebration.",
  },
  {
    t: "6:07", ap: "PM", last: true, sun: true, keyCard: true,
    tag: "Varmala · Garland Exchange", title: "Varmala at sunset",
    desc: "Timed to the setting sun, Tulsi enters with her brothers beneath a canopy of flowers. The couple exchange floral garlands — their first ceremony together, a sign of acceptance and joy.",
    span: "The moment not to miss",
  },
]

const LAGNA_CEREMONY: TLRow[] = [
  {
    t: "6:45", ap: "PM", first: true,
    tag: "Groom's Entry", title: "The ceremony begins",
    desc: "Vraj takes his place at the mandap, entering with his grandparents, and the pandit begins the wedding rites.",
  },
  {
    t: "7:15", ap: "PM",
    tag: "Hast Melap", title: "Tulsi arrives",
    desc: "Tulsi makes her entrance to the beat of the Nasik dhol, walking beneath her grandmother's saree held overhead — and the couple's hands are joined as the rites continue.",
  },
  {
    t: "7:15", ap: "PM",
    tag: "Dinner",
    desc: "Dinner is served alongside the ceremony — there's no fixed sitting, so eat whenever you like.",
  },
  {
    t: "8:15", ap: "PM",
    tag: "Pheras",
    desc: "The couple take their pheras around the sacred fire — the defining rites of the marriage.",
  },
  {
    t: "8:45", ap: "PM",
    tag: "Reception", title: "Greet the couple",
    desc: "Offer your blessings, share a moment with Tulsi and Vraj, and capture a photograph together.",
  },
  {
    t: "9:30", ap: "PM",
    tag: "Family Dinner",
    desc: "The families gather for dinner together as the celebration continues.",
  },
  {
    t: "10:30", ap: "PM", last: true,
    tag: "Vidaai · Farewell", title: "The vidaai",
    desc: "The tender farewell, as Tulsi departs with her new family. A moment of joy and a few happy tears — your presence and blessings mean everything.",
  },
]

// The pre-wedding events, one section each, matching the Wardrobe Planner's
// event list. Schedules (`rows`) are filled in as the couple confirms them —
// an empty list renders a "schedule to be announced" placeholder.
type EventSection = {
  id: string
  kicker: string
  title: string
  intro: string
  timelineLabel: string
  rows: TLRow[]
  venue?: typeof VENUE
}

const PRE_EVENTS: EventSection[] = [
  {
    id: "mehendi",
    kicker: "Saturday · Jan 2 · Evening",
    title: "Mehendi",
    intro:
      "Henna, thumkas, and breaking the ice — one game at a time.",
    timelineLabel: "The Evening's Flow",
    rows: [
      {
        t: "4:30", ap: "PM", first: true,
        tag: "Guest Arrival",
        desc: "Make your way over, say your hellos, and settle in as the celebrations get underway.",
      },
      {
        t: "5:00", ap: "PM",
        tag: "Henna",
        desc: "The mehendi artists get to work as fun and games keep everyone entertained.",
      },
      {
        t: "7:00", ap: "PM", last: true,
        tag: "Dinner",
      },
    ],
  },
  {
    id: "haldi-tulsi",
    kicker: "Sunday · Jan 3 · Afternoon",
    title: "Tulsi's Vidhi & Haldi",
    intro:
      "Auspicious vidhi rituals and a joyful turmeric ceremony to bless Tulsi ahead of the wedding.",
    timelineLabel: "The Day's Rituals",
    rows: [
      {
        t: "1:30", ap: "PM", first: true,
        tag: "Ganesh Puja",
        desc: "The day opens with a prayer to Lord Ganesha for an auspicious beginning.",
      },
      {
        t: "2:15", ap: "PM",
        tag: "Mandap Muharat",
        desc: "A ritual to bless the mandap and formally begin the wedding preparations.",
      },
      {
        t: "2:45", ap: "PM",
        tag: "Pithi",
        desc: "The turmeric ceremony — family and friends take turns applying pithi to bless Tulsi.",
      },
      {
        t: "4:00", ap: "PM",
        tag: "Grah Shanti",
        desc: "A puja inviting peace and harmony ahead of the wedding.",
      },
      {
        t: "6:00", ap: "PM",
        tag: "Varadh",
      },
      {
        t: "7:00", ap: "PM", last: true,
        tag: "Dinner",
      },
    ],
  },
  {
    id: "haldi-vraj",
    kicker: "Monday · Jan 4 · Morning",
    title: "Vraj's Vidhi & Haldi",
    intro:
      "Auspicious vidhi rituals and a joyful turmeric ceremony to bless Vraj ahead of the wedding.",
    timelineLabel: "Morning Rituals",
    rows: [
      {
        t: "8:00", ap: "AM", first: true,
        tag: "Ganesh Puja",
        desc: "The day opens with a prayer to Lord Ganesha for an auspicious beginning.",
      },
      {
        t: "8:45", ap: "AM",
        tag: "Mandap Muharat",
        desc: "A ritual to bless the mandap and formally begin the wedding preparations.",
      },
      {
        t: "9:15", ap: "AM",
        tag: "Pithi",
        desc: "The turmeric ceremony — family and friends take turns applying pithi to bless Vraj.",
      },
      {
        t: "10:00", ap: "AM",
        tag: "Grah Shanti",
        desc: "A puja inviting peace and harmony ahead of the wedding.",
      },
      {
        t: "12:00", ap: "PM", last: true,
        tag: "Varadh & Lunch",
      },
    ],
  },
  {
    id: "sangeet",
    kicker: "Monday · Jan 4 · Evening",
    title: "Sangeet",
    intro:
      "An evening of music, dance performances and celebration — the glam night before the wedding day.",
    timelineLabel: "The Evening's Flow",
    venue: SANGEET_VENUE,
    rows: [
      {
        t: "6:30", ap: "PM", first: true,
        tag: "Guest Arrival",
        desc: "Arrive, settle in, and soak up the atmosphere as the night gets going.",
      },
      {
        t: "7:00", ap: "PM",
        tag: "Couple's Entry & Introductions",
        desc: "Tulsi and Vraj make their entrance, and the families are introduced.",
      },
      {
        t: "7:30", ap: "PM",
        tag: "Performances",
        desc: "Family and friends take the stage with dances prepared for the couple.",
      },
      {
        t: "8:30", ap: "PM",
        tag: "Dinner",
      },
      {
        t: "9:00", ap: "PM",
        tag: "Garba",
        desc: "Gujarati folk dance. Not to be missed!",
      },
      {
        t: "9:30", ap: "PM", last: true,
        tag: "Open Dance Floor",
        desc: "Hit the dance floor!",
      },
    ],
  },
]

// ----------------------------------------------------------------------------
// Presentational helpers
// ----------------------------------------------------------------------------

// Circular "Get Directions" icon button, set beside each event title — fades/
// drops in as its section scrolls into view (piggybacking on the .reveal
// observer set up below), and opens a popover with the venue address + map
// link on hover or click/tap.
function DirectionsCTA({ venue = VENUE }: { venue?: typeof VENUE }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  const openNow = () => {
    cancelClose()
    setOpen(true)
  }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), 200)
  }

  useEffect(() => () => cancelClose(), [])

  return (
    <div className="event-directions reveal" onMouseEnter={openNow} onMouseLeave={scheduleClose}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="directions-trigger" aria-label="Get directions to the venue">
            <MapPin className="w-4 h-4 pin-ico" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={10}
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
          className="w-72 rounded-2xl border border-stone-200 bg-stone-50 p-5 shadow-2xl font-serif text-stone-800"
        >
          <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.22em] text-[oklch(0.52_0.13_150)]">
            Venue
          </p>
          <h4 className="mt-2 text-lg text-stone-900">{venue.name}</h4>
          <p className="mt-1.5 font-sans text-sm leading-relaxed text-stone-600">{venue.address}</p>
          <a
            href={venue.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 font-sans text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-stone-700"
          >
            <MapPin className="h-3.5 w-3.5" />
            Open in Google Maps
          </a>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function Timeline({ label, rows }: { label: string; rows: TLRow[] }) {
  return (
    <div className="block reveal">
      <div className="subhead">
        <span className="l">{label}</span>
        <span className="rule" />
      </div>
      <div className="tl">
        {rows.map((r, i) => (
          <div
            key={`${r.t}-${i}`}
            className={
              "tl-row" +
              (r.first ? " is-first" : "") +
              (r.last ? " is-last" : "") +
              (r.sun ? " is-sun" : "")
            }
          >
            <div className="tl-time">
              <span className="t">{r.t}</span>
              <span className="ap">{r.ap}</span>
            </div>
            <div className="tl-rail">
              <span className="tl-dot" />
            </div>
            <div className={"tl-card" + (r.keyCard ? " is-key" : "")}>
              <p className="tag">{r.tag}</p>
              {r.title && <h4>{r.title}</h4>}
              {r.desc && <p className="desc">{r.desc}</p>}
              {r.span && <span className="span">{r.span}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export function Itinerary() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const root = document.querySelector(".itin-root")
    if (!root) return

    // Scrollspy — highlight the sticky-nav link for the section in view.
    const sections = Array.from(root.querySelectorAll<HTMLElement>("section[id]"))
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId((e.target as HTMLElement).id)
        })
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    )
    sections.forEach((s) => spy.observe(s))

    // Reveal-on-scroll.
    const reveals = Array.from(root.querySelectorAll<HTMLElement>(".reveal"))
    const ro = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in")
            ro.unobserve(e.target)
          }
        })
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    )
    reveals.forEach((r) => ro.observe(r))

    const onScroll = () => setShowTop(window.scrollY > 700)
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()

    return () => {
      spy.disconnect()
      ro.disconnect()
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  const jumpTo = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="itin-root">
      {/* Hero */}
      <header className="hero">
        <div className="hero-img" aria-hidden="true" />
        <div className="wrap hero-inner">
          <p className="hero-kicker">~ Itinerary ~</p>
          <h1 className="hero-title">The Gujarati Wedding</h1>
          <p className="hero-sub">
            Four days of Gujarati shenanigans! Let’s create beautiful memories with music, traditions, and the people we love most. Bring out your brightest Indian glam, your loudest cheers, and your biggest smiles for four unforgettable days filled with love, joy, and celebration.
          </p>
          <div className="hero-meta">
            <span>Vadodara</span>
            <span className="dot" />
            <span>Jan 2 – 5, 2027</span>
          </div>
        </div>
      </header>

      {/* Sticky nav */}
      <nav className="subnav" id="subnav">
        <div className="wrap">
          <div className="subnav-row">
            <span className="subnav-brand">Events</span>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                className={"subnav-link" + (activeId === s.id ? " is-active" : "")}
                href={`#${s.id}`}
                onClick={(e) => jumpTo(e, s.id)}
              >
                <span className="link-day">{s.day}</span>
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Pre-wedding events — Mehendi, both Vidhi & Haldis, Sangeet */}
      {PRE_EVENTS.map((ev, i) => (
        <section id={ev.id} key={ev.id} className={"sec" + (i % 2 === 1 ? " alt" : "")}>
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="kicker">{ev.kicker}</span>
              <div className="sec-title-row">
                <h2 className="sec-title">{ev.title}</h2>
                <DirectionsCTA venue={ev.venue} />
              </div>
              <p className="sec-intro">{ev.intro}</p>
            </div>
            {ev.rows.length > 0 ? (
              <Timeline label={ev.timelineLabel} rows={ev.rows} />
            ) : (
              <div className="block reveal">
                <div className="subhead">
                  <span className="l">Schedule</span>
                  <span className="rule" />
                </div>
                <span className="tba">Full schedule to be announced</span>
              </div>
            )}
          </div>
        </section>
      ))}

      {/* Lagna — the wedding day, from the baraat through the farewell */}
      <section id="lagna" className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Tuesday · Jan 5 · Evening</span>
            <div className="sec-title-row">
              <h2 className="sec-title">Lagna</h2>
              <DirectionsCTA />
            </div>
            <p className="sec-intro">
              The wedding day itself, at Aambaug. Aim to arrive directly for the baraat — the heart
              of the evening is the varmala, exchanged as the sun sets.
            </p>
          </div>

          <Timeline label="The Baraat & Varmala" rows={LAGNA_OPENING} />
          <Timeline label="Gather & Settle In" rows={LAGNA_CEREMONY} />
        </div>
      </section>

      {/* Footer */}
      <footer className="foot">
        <div className="foot-tex" aria-hidden="true" />
        <div className="wrap foot-inner">
          <div className="flo">❀ ❀ ❀</div>
          <h3>
            We can&apos;t wait to celebrate
            <br />
            this day with you
          </h3>
          <p>Come early, stay late, and dance with us under the Vadodara sky. With love and aabhar —</p>
          <div className="sig">Tulsi &amp; Vraj</div>
          <div className="foot-links">
            <Link href="/guide">Travel Guide</Link>
            <Link href="/wardrobe-planner">Wardrobe Planner</Link>
          </div>
        </div>
      </footer>

      <button
        className={"backtop" + (showTop ? " show" : "")}
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ArrowUp size={20} strokeWidth={1.6} />
      </button>
    </div>
  )
}
