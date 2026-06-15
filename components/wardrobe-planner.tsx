"use client"

import { useRef, useState } from "react"
import { Flower2, Sun, Music, Gem, Heart, type LucideIcon } from "lucide-react"

type PaletteColor = { name: string; hex: string }

type WardrobeEvent = {
  id: string
  name: string
  host: string | null
  date: string
  dayNum: string
  day: string
  time: string
  icon: LucideIcon
  blurb: string
  code: string
  mood: string
  /** Accent colour for the event icon. */
  key: string
  palette: PaletteColor[]
  women: string
  men: string
  avoid: string
}

// The five events, keyed to the site's EVENTS button, each with a suggested
// traditional dress code and colour palette. Sourced from the design handoff.
const EVENTS: WardrobeEvent[] = [
  {
    id: "mehendi",
    name: "Mehendi",
    host: null,
    date: "Jan 2, 2027",
    dayNum: "02",
    day: "Saturday",
    time: "Daytime",
    icon: Flower2,
    blurb: "Henna, music and dance with family and friends.",
    code: "Fresh & Festive",
    mood: "Light daytime florals — lean into bright, joyful colour.",
    key: "#C8467F",
    palette: [
      { name: "Marigold", hex: "#E5A235" },
      { name: "Mehndi Green", hex: "#6E8C3F" },
      { name: "Rani Pink", hex: "#C8467F" },
      { name: "Ivory", hex: "#F1E7D2" },
    ],
    women: "A bright lehenga, sharara, or a flowy anarkali in fresh florals.",
    men: "Cotton kurta with churidar; a printed waistcoat adds polish.",
    avoid: "Heavy gowns — your hands will be busy with henna.",
  },
  {
    id: "haldi-tulsi",
    name: "Vidhi & Haldi",
    host: "Tulsi's",
    date: "Jan 3, 2027",
    dayNum: "03",
    day: "Sunday",
    time: "Morning",
    icon: Sun,
    blurb: "Auspicious rituals and turmeric for blessing and glow.",
    code: "Haldi Hues",
    mood: "Sun-warm yellows and whites — turmeric is in the air.",
    key: "#E6B12E",
    palette: [
      { name: "Turmeric", hex: "#E6B12E" },
      { name: "Marigold Orange", hex: "#E07B2C" },
      { name: "Soft White", hex: "#F6F0E1" },
      { name: "Tender Green", hex: "#9DB06A" },
    ],
    women: "Light cotton or organza in yellow — you will be dusted in haldi.",
    men: "A simple kurta you do not mind staining; whites and yellows.",
    avoid: "Anything precious — haldi stains for keeps.",
  },
  {
    id: "haldi-vraj",
    name: "Vidhi & Haldi",
    host: "Vraj's",
    date: "Jan 4, 2027",
    dayNum: "04",
    day: "Monday",
    time: "Morning",
    icon: Sun,
    blurb: "Auspicious rituals and turmeric for blessing and glow.",
    code: "Haldi Hues",
    mood: "Sun-warm yellows and whites — turmeric is in the air.",
    key: "#E07B2C",
    palette: [
      { name: "Turmeric", hex: "#E6B12E" },
      { name: "Marigold Orange", hex: "#E07B2C" },
      { name: "Soft White", hex: "#F6F0E1" },
      { name: "Tender Green", hex: "#9DB06A" },
    ],
    women: "Light cotton or organza in yellow — you will be dusted in haldi.",
    men: "A simple kurta you do not mind staining; whites and yellows.",
    avoid: "Anything precious — haldi stains for keeps.",
  },
  {
    id: "sangeet",
    name: "Sangeet",
    host: null,
    date: "Jan 4, 2027",
    dayNum: "04",
    day: "Monday",
    time: "Evening",
    icon: Music,
    blurb: "An evening of music, dance performances and celebration.",
    code: "Jewel & Shine",
    mood: "Rich jewel tones and metallics — the glam night.",
    key: "#2C4C8C",
    palette: [
      { name: "Sapphire", hex: "#2C4C8C" },
      { name: "Emerald", hex: "#1C7A5B" },
      { name: "Plum", hex: "#6A2A63" },
      { name: "Antique Gold", hex: "#C49A3A" },
    ],
    women: "A floor-length gown or heavy lehenga — this is the night to shine.",
    men: "A bandhgala, indo-western, or deep-toned kurta with a Nehru jacket.",
    avoid: "Daytime pastels — go rich and shimmering.",
  },
  {
    id: "lagna",
    name: "Lagna",
    host: null,
    date: "Jan 5, 2027",
    dayNum: "05",
    day: "Tuesday",
    time: "Ceremony",
    icon: Gem,
    blurb: "The sacred ceremony — the pheras and the tying of the knot.",
    code: "Regal Tradition",
    mood: "Classic reds, gold and maroon — formal and ceremonial.",
    key: "#A52436",
    palette: [
      { name: "Vermilion", hex: "#A52436" },
      { name: "Maroon", hex: "#6E1C2C" },
      { name: "Temple Gold", hex: "#C6A24A" },
      { name: "Ivory", hex: "#F1E7D2" },
    ],
    women: "A silk saree or festive lehenga in red, gold, or maroon.",
    men: "A sherwani or silk kurta with a stole — classic and formal.",
    avoid: "Black and stark white — traditionally kept for other occasions.",
  },
]

function eventTitle(ev: Pick<WardrobeEvent, "host" | "name">) {
  return ev.host ? `${ev.host} ${ev.name}` : ev.name
}

function Swatch({
  color,
  copied,
  onCopy,
}: {
  color: PaletteColor
  copied: boolean
  onCopy: (hex: string) => void
}) {
  return (
    <button
      type="button"
      className="wp-sw"
      onClick={() => onCopy(color.hex)}
      title={`Click to copy ${color.hex}`}
    >
      <span className="wp-sw-chip" style={{ background: color.hex }}>
        {copied ? <span className="wp-sw-copied">Copied</span> : null}
      </span>
      <span className="wp-sw-name">{color.name}</span>
      <span className="wp-sw-hex">{color.hex.toUpperCase()}</span>
    </button>
  )
}

export function WardrobePlanner() {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const ev = EVENTS[active]
  const EventIcon = ev.icon

  const copy = (hex: string) => {
    navigator.clipboard?.writeText(hex).catch(() => {})
    setCopied(hex)
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(null), 1100)
  }

  return (
    <section id="wardrobe-planner" className="wp-root scroll-mt-24">
      <div className="wp-container">
        {/* Header */}
        <header className="wp-head">
          <span className="wp-kicker">Wardrobe Planner</span>
          <h2 className="wp-title">What to Wear</h2>
          <p className="wp-sub">
            A colour guide for every celebration — five days, five moods. Come dressed for the moment.
          </p>
        </header>

        {/* Event tabs */}
        <div className="dirA-tabs">
          {EVENTS.map((e, i) => (
            <button
              key={e.id}
              type="button"
              className={"dirA-tab" + (i === active ? " is-active" : "")}
              onClick={() => {
                setActive(i)
                setCopied(null)
              }}
              aria-pressed={i === active}
            >
              <span className="dirA-tab-day">{e.dayNum}</span>
              <span className="dirA-tab-name">{eventTitle(e)}</span>
            </button>
          ))}
        </div>

        {/* Featured spread */}
        <div className="dirA-spread">
          {/* Left — colour-field mood panel */}
          <div className="dirA-mood">
            <div className="dirA-bands">
              {ev.palette.map((c) => (
                <div key={c.hex} className="dirA-band" style={{ background: c.hex }} />
              ))}
            </div>
            <div className="dirA-mood-tex" aria-hidden="true" />
            <div className="dirA-mood-card">
              <span className="dirA-mood-ico" style={{ color: ev.key }}>
                <EventIcon size={22} strokeWidth={1.6} />
              </span>
              <span className="dirA-mood-code">{ev.code}</span>
              <span className="dirA-mood-mood">{ev.mood}</span>
            </div>
          </div>

          {/* Right — details */}
          <div className="dirA-detail">
            <div className="dirA-meta">
              <span>{ev.date}</span>
              <span className="wp-dot">·</span>
              <span>{ev.day}</span>
              <span className="wp-dot">·</span>
              <span>{ev.time}</span>
            </div>
            <h3 className="dirA-event">{eventTitle(ev)}</h3>
            <p className="dirA-blurb">{ev.blurb}</p>

            <div className="wp-label">The Palette</div>
            <div className="dirA-swatches">
              {ev.palette.map((c) => (
                <Swatch key={c.hex} color={c} copied={copied === c.hex} onCopy={copy} />
              ))}
            </div>

            <div className="dirA-suggest">
              <div className="dirA-sug">
                <span className="dirA-sug-l">For her</span>
                <p>{ev.women}</p>
              </div>
              <div className="dirA-sug">
                <span className="dirA-sug-l">For him</span>
                <p>{ev.men}</p>
              </div>
            </div>

            <div className="dirA-avoid">
              <span className="dirA-avoid-l">Good to know</span>
              <span>{ev.avoid}</span>
            </div>

            <div className="dirA-actions">
              <button
                type="button"
                className={"wp-btn wp-btn-primary" + (saved[ev.id] ? " is-saved" : "")}
                onClick={() => setSaved((s) => ({ ...s, [ev.id]: !s[ev.id] }))}
              >
                <Heart size={15} strokeWidth={1.6} />
                {saved[ev.id] ? "Saved to my plan" : "Save this look"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
