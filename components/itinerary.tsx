"use client"

import { useEffect, useState, type MouseEvent, type ReactNode } from "react"
import Link from "next/link"
import { Clock, Sunset, Utensils, Shirt, Camera, MapPin, ArrowUp, type LucideIcon } from "lucide-react"

// ----------------------------------------------------------------------------
// Content — distilled from the claude.ai/design handoff (project/Itinerary.html),
// itself built from the couple's wedding itinerary document. A warm,
// guest-facing timeline of the wedding week (Jan 2–5, 2027 · Vadodara): one
// section per event, mirroring the Wardrobe Planner's event list, with the
// wedding day itself condensed into the Lagna section.
// ----------------------------------------------------------------------------

const SECTIONS = [
  { id: "mehendi", label: "Mehendi" },
  { id: "haldi-tulsi", label: "Tulsi's Haldi" },
  { id: "haldi-vraj", label: "Vraj's Haldi" },
  { id: "sangeet", label: "Sangeet" },
  { id: "lagna", label: "Lagna" },
  { id: "know", label: "Good to Know" },
] as const

type GlanceCard = { tag: string; big: string; small: string; key?: boolean }

const GLANCE: GlanceCard[] = [
  { tag: "Welcome Hour & Hi-Tea", big: "4:00 PM", small: "Arrive, settle in, and enjoy tea and snacks." },
  { tag: "The Baraat", big: "5:00 PM", small: "The celebration sets off with drums and dancing." },
  { tag: "Varmala", big: "6:07 PM", small: "The garland exchange — the moment not to miss.", key: true },
  { tag: "Ceremony", big: "6:45 PM", small: "The wedding rites begin, with dinner alongside." },
]

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

const BARAAT: TLRow[] = [
  {
    t: "4:00", ap: "PM", first: true,
    tag: "Welcome & Hi-Tea", title: "Arrival & refreshments",
    desc: "Make your way to Aambaug and enjoy tea and snacks as the baraat gathers and the evening begins.",
  },
  {
    t: "5:00", ap: "PM", last: true,
    tag: "Groom's Procession", title: "The Baraat begins",
    desc: "Vraj sets off in a lively procession to the beat of the dhol and the DJ. Family and friends dance their way to the venue — please join the celebration.",
    span: "~ 5:00 – 5:55 PM",
  },
]

const VARMALA: TLRow[] = [
  {
    t: "5:55", ap: "PM", first: true,
    tag: "Arrival", title: "Varmala",
    desc: "The procession reaches Aambaug to the welcome of the Nasik dhol as everyone gathers for the garland exchange.",
  }
]

const CEREMONY: TLRow[] = [
  {
    t: "6:45", ap: "PM",
    tag: "Groom's Entry", title: "The ceremony begins",
    desc: "Vraj takes his place at the mandap, entering with his grandparents, and the pandit begins the wedding rites.",
  },
  {
    t: "7:15", ap: "PM",
    tag: "Bride's Entry", title: "Tulsi arrives",
    desc: "Tulsi makes her entrance to the beat of the Nasik dhol, walking beneath her grandmother's saree held overhead, accompanied by her maternal uncle and aunt.",
  },
  {
    t: "7:15", ap: "PM", last: true,
    tag: "Vivah & Dinner", title: "Wedding rituals & dinner",
    desc: "The marriage rites continue around the sacred fire while dinner service opens. Ceremonies and dining flow together — graze whenever you like.",
    span: "~ 7:15 – 8:30 PM",
  },
]

const CELEBRATION: TLRow[] = [
  {
    t: "8:30", ap: "PM", first: true,
    tag: "Reception Hour", title: "Greet the couple",
    desc: "Offer your blessings, share a moment with Tulsi and Vraj, and capture a photograph together.",
    span: "~ 8:30 – 9:30 PM",
  },
  {
    t: "9:30", ap: "PM",
    tag: "Dinner", title: "Dinner with family",
    desc: "The families gather for dinner together as the celebration continues.",
  },
  {
    t: "10:15", ap: "PM",
    tag: "Ganpati Puja & Thappa", title: "A closing prayer",
    desc: "A post-dinner prayer to Lord Ganesha to bless the marriage and the journey ahead.",
  },
  {
    t: "10:30", ap: "PM",
    tag: "Bidaai · Farewell", title: "The vidaai",
    desc: "The tender farewell, as Tulsi departs with her new family. A moment of joy and a few happy tears — your presence and blessings mean everything.",
  },
  {
    t: "11:00", ap: "PM", last: true,
    tag: "Departure", title: "The couple departs",
    desc: "The newlyweds set off into married life. Safe travels home — and thank you for celebrating with us.",
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
        desc: "The turmeric ceremony — family and friends take turns applying pithi to bless Tulsi.",
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

type Fact = { icon: LucideIcon; label: string; title: string; text: ReactNode }

const FACTS: Fact[] = [
  {
    icon: Clock, label: "Timing", title: "Arrive by 4:30 PM",
    text: "Come early so you don't miss the baraat — and settle in well before the sunset varmala around 6:07 PM.",
  },
  {
    icon: Sunset, label: "Don't Miss", title: "The sunset varmala",
    text: "The garland exchange is the heart of the evening. Be in your seat a little early to catch it.",
  },
  {
    icon: Utensils, label: "Dining", title: "Eat whenever you like",
    text: "Dinner is served alongside the ceremony — there's no fixed sitting, so graze at your own pace.",
  },
  {
    icon: Shirt, label: "Dress", title: "Festive Indian attire",
    text: (
      <>
        Bright, celebratory colours are perfect. See the{" "}
        <Link href="/wardrobe-planner">Wardrobe Planner</Link> for ideas for each event.
      </>
    ),
  },
  {
    icon: Camera, label: "Photos", title: "Capture, then pause",
    text: "Photographs are welcome — but please step back and be present during the sacred rites at the mandap.",
  },
  {
    icon: MapPin, label: "Getting There", title: "Plan your ride",
    text: (
      <>
        See the <Link href="/guide">Travel Guide</Link> for transport around Vadodara. Shuttle details,
        if arranged, will be shared closer to the date.
      </>
    ),
  },
]

// ----------------------------------------------------------------------------
// Presentational helpers
// ----------------------------------------------------------------------------

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
            <span className="subnav-brand">The Wedding Itinerary</span>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                className={"subnav-link" + (activeId === s.id ? " is-active" : "")}
                href={`#${s.id}`}
                onClick={(e) => jumpTo(e, s.id)}
              >
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
              <h2 className="sec-title">{ev.title}</h2>
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
            <h2 className="sec-title">Lagna</h2>
            <p className="sec-intro">
              The wedding day itself, at Aambaug. Aim to arrive directly for the baraat — the heart
              of the evening is the varmala, exchanged as the sun sets.
            </p>
          </div>

          <div className="block reveal">
            <div className="glance">
              {GLANCE.map((g) => (
                <div className={"gcard" + (g.key ? " is-key" : "")} key={g.tag}>
                  <div className="tag">{g.tag}</div>
                  <div className="big">{g.big}</div>
                  <div className="small">{g.small}</div>
                </div>
              ))}
            </div>
          </div>

          <Timeline label="The Baraat" rows={BARAAT} />
          <Timeline label="Welcome & Varmala" rows={VARMALA} />
          <Timeline label="The Wedding Ceremony" rows={CEREMONY} />
          <Timeline label="Reception & Farewell" rows={CELEBRATION} />
        </div>
      </section>

      {/* Good to Know */}
      <section id="know" className="sec alt">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Good to Know</span>
            <h2 className="sec-title">A few gentle notes</h2>
            <p className="sec-intro">
              Small things to help the evening go smoothly — so you can relax and be fully present.
            </p>
          </div>

          <div className="block reveal">
            <div className="facts">
              {FACTS.map((f) => {
                const Icon = f.icon
                return (
                  <div className="fact" key={f.title}>
                    <div className="fact-top">
                      <Icon size={18} strokeWidth={1.6} />
                      <span>{f.label}</span>
                    </div>
                    <h4>{f.title}</h4>
                    <p>{f.text}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="block reveal">
            <div className="subhead">
              <span className="l">The Venue</span>
              <span className="rule" />
            </div>
            <div className="venue">
              <div className="pp">
                <span className="k">Where</span>
                <h4>Aambaug, Vadodara</h4>
                <p>
                  The full address, map link, and any shuttle pick-up times will be confirmed here as
                  the day approaches.
                </p>
                <span className="tba">Address to be announced</span>
              </div>
              <div className="hosp">
                <span className="k">Questions</span>
                <h4>We&apos;re here to help</h4>
                <p>
                  For anything about timings or logistics on the day, please reach out to our point
                  person — see the <Link href="/guide">Travel Guide</Link> for contacts.
                </p>
              </div>
            </div>
          </div>
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
