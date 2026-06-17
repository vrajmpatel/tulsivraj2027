"use client"

import { useEffect, useState, type MouseEvent, type ReactNode } from "react"
import Link from "next/link"
import { Clock, Sunset, Utensils, Shirt, Camera, MapPin, ArrowUp, type LucideIcon } from "lucide-react"

// ----------------------------------------------------------------------------
// Content — distilled from the claude.ai/design handoff (project/Itinerary.html),
// itself built from the couple's wedding-day itinerary document. A warm,
// guest-facing timeline of the wedding day (Tuesday, Jan 5 2027 · Aambaug).
// ----------------------------------------------------------------------------

const SECTIONS = [
  { id: "glance", label: "At a Glance" },
  { id: "baraat", label: "The Baraat" },
  { id: "varmala", label: "Welcome & Varmala" },
  { id: "ceremony", label: "The Ceremony" },
  { id: "celebration", label: "Celebration" },
  { id: "know", label: "Good to Know" },
] as const

type GlanceCard = { tag: string; big: string; small: string; key?: boolean }

const GLANCE: GlanceCard[] = [
  { tag: "Doors & Hi-Tea", big: "4:00 PM", small: "Arrive, settle in, and enjoy tea and snacks." },
  { tag: "The Baraat", big: "5:00 PM", small: "Vraj's procession sets off with drums and dancing." },
  { tag: "Varmala · Sunset", big: "6:07 PM", small: "The garland exchange — the moment not to miss.", key: true },
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
  title: string
  desc: string
  span?: string
}

const BARAAT: TLRow[] = [
  {
    t: "4:00", ap: "PM", first: true,
    tag: "Welcome & Hi-Tea", title: "Arrival & refreshments",
    desc: "Make your way to Aambaug, find your bearings, and enjoy tea and snacks as the baraat gathers and the evening begins.",
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
    tag: "Arrival", title: "The Baraat arrives",
    desc: "The procession reaches Aambaug to the welcome of the Nasik dhol as everyone gathers for the garland exchange.",
  },
  {
    t: "6:07", ap: "PM", sun: true, keyCard: true,
    tag: "Varmala · Garland Exchange", title: "Jaimala at sunset",
    desc: "Timed to the setting sun, Tulsi enters with her brothers beneath a canopy of flowers. The couple exchange floral garlands — their first ceremony together, a sign of acceptance and joy.",
    span: "The moment not to miss",
  },
  {
    t: "6:10", ap: "PM", last: true,
    tag: "Ponkhvanu", title: "Welcoming the groom",
    desc: "The bride's family welcomes Vraj with a warm, playful ritual at the entrance before everyone settles in for the ceremony.",
  },
]

const CEREMONY: TLRow[] = [
  {
    t: "6:30", ap: "PM", first: true,
    tag: "Settle In", title: "Music & gathering",
    desc: "A team of Gujarati musical singers opens the evening as guests find their seats ahead of the ceremony.",
  },
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
              <h4>{r.title}</h4>
              <p className="desc">{r.desc}</p>
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
          <p className="hero-kicker">~ Subh Lagna ~</p>
          <h1 className="hero-title">The Wedding Day</h1>
          <p className="hero-sub">
            An evening of ceremony and celebration at Aambaug — from the baraat through the sunset
            varmala to the wedding rites and the farewell. Here&apos;s how the day unfolds.
          </p>
          <div className="hero-meta">
            <span>Tulsi &amp; Vraj</span>
            <span className="dot" />
            <span>Aambaug · Vadodara</span>
            <span className="dot" />
            <span>Tuesday · Jan 5, 2027</span>
          </div>
        </div>
      </header>

      {/* Sticky nav */}
      <nav className="subnav" id="subnav">
        <div className="wrap">
          <div className="subnav-row">
            <span className="subnav-brand">The Wedding Day</span>
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

      {/* At a Glance */}
      <section id="glance" className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">At a Glance</span>
            <h2 className="sec-title">The shape of the evening</h2>
            <p className="sec-intro">
              The celebration runs from late afternoon into the night. Aim to arrive in good time for
              the baraat — the heart of the evening is the varmala, exchanged as the sun sets.
            </p>
          </div>

          <div className="glance reveal">
            {GLANCE.map((g) => (
              <div className={"gcard" + (g.key ? " is-key" : "")} key={g.tag}>
                <div className="tag">{g.tag}</div>
                <div className="big">{g.big}</div>
                <div className="small">{g.small}</div>
              </div>
            ))}
          </div>

          <p className="note-line reveal">
            <Clock size={18} strokeWidth={1.6} />
            <span>
              Like most Indian weddings, the evening flows at its own gentle pace — these times are a
              guide, not a strict schedule. Come early, stay late, and enjoy every moment.
            </span>
          </p>
        </div>
      </section>

      {/* The Baraat */}
      <section id="baraat" className="sec alt">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Late Afternoon</span>
            <h2 className="sec-title">The Baraat</h2>
            <p className="sec-intro">
              The groom&apos;s joyful arrival. The afternoon opens with snacks and tea before Vraj&apos;s
              procession winds its way to the venue with music and dancing — everyone is welcome to
              join in.
            </p>
          </div>
          <Timeline label="Procession & Welcome" rows={BARAAT} />
        </div>
      </section>

      {/* Welcome & Varmala */}
      <section id="varmala" className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Sunset</span>
            <h2 className="sec-title">Welcome &amp; Varmala</h2>
            <p className="sec-intro">
              As the baraat reaches the venue, the two families come together. The garland exchange —
              the varmala — is timed for sunset and is the emotional opening of the wedding.
            </p>
          </div>
          <Timeline label="The Couple Meets" rows={VARMALA} />
        </div>
      </section>

      {/* The Ceremony */}
      <section id="ceremony" className="sec alt">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Evening</span>
            <h2 className="sec-title">The Wedding Ceremony</h2>
            <p className="sec-intro">
              Under the guidance of the pandit, the sacred rites unfold around the holy fire. Gujarati
              folk singers set the mood, and dinner is served alongside — so please eat whenever you
              wish.
            </p>
          </div>
          <Timeline label="The Rites Begin" rows={CEREMONY} />
        </div>
      </section>

      {/* Celebration */}
      <section id="celebration" className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Into the Night</span>
            <h2 className="sec-title">Reception &amp; Farewell</h2>
            <p className="sec-intro">
              With the vows complete, the evening turns to celebration — greeting the couple, dinner
              with family, and the bittersweet farewell that closes the night.
            </p>
          </div>
          <Timeline label="Celebrate & Send Off" rows={CELEBRATION} />
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
