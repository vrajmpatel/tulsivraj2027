"use client"

import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { Flower2, Sun, Music, Gem, Download, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react"

type PaletteColor = { name: string; hex: string }

type Gender = "women" | "men"

/** event-folder -> gender -> image URLs under /public/wardrobe, read server-side. */
export type WardrobeImages = Record<string, Record<Gender, string[]>>

// Both haldi ceremonies (Tulsi's and Vraj's) share one set of reference photos.
function wardrobeFolder(eventId: string): string {
  return eventId.startsWith("haldi") ? "haldi" : eventId
}

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
    date: "Jan 2",
    dayNum: "02",
    day: "Saturday",
    time: "Daytime",
    icon: Flower2,
    blurb: "Henna, music and dance with family and friends.",
    code: "Fresh & Festive",
    mood: "Light daytime florals — lean into bright, joyful colour.",
    key: "#A8431E",
    palette: [
      { name: "Beige", hex: "#E0D2B4" },
      { name: "Deep Rust Orange", hex: "#A8431E" },
      { name: "Camel", hex: "#C19A6B" },
      { name: "Laurel Green", hex: "#A9BA9D" },
      { name: "Dark Olive Green", hex: "#556B2F" },
      { name: "Brick Red", hex: "#8B3A2B" },
      { name: "Navy Blue", hex: "#1F2D54" },
    ],
    women: "A bright lehenga, sharara, or a flowy anarkali in fresh florals.",
    men: "Cotton kurta with churidar; a printed waistcoat adds polish.",
    avoid: "Heavy gowns — your hands will be busy with henna.",
  },
  {
    id: "haldi-tulsi",
    name: "Vidhi & Haldi",
    host: "Tulsi's",
    date: "Jan 3",
    dayNum: "03",
    day: "Sunday",
    time: "Morning",
    icon: Sun,
    blurb: "Auspicious rituals and turmeric for blessing and glow.",
    code: "Haldi Hues",
    mood: "Sun-warm yellows and whites — turmeric is in the air.",
    key: "#C8467F",
    palette: [
      { name: "Rani Pink", hex: "#C8467F" },
      { name: "Warm Orange", hex: "#E0772C" },
      { name: "Marigold Yellow", hex: "#EAA221" },
      { name: "White", hex: "#F4EFE2" },
      { name: "Green", hex: "#5B9A47" },
    ],
    women: "Light cotton or organza in yellow — you will be dusted in haldi.",
    men: "A simple kurta you do not mind staining; whites and yellows.",
    avoid: "Anything precious — haldi stains for keeps.",
  },
  {
    id: "haldi-vraj",
    name: "Vidhi & Haldi",
    host: "Vraj's",
    date: "Jan 4",
    dayNum: "04",
    day: "Monday",
    time: "Morning",
    icon: Sun,
    blurb: "Auspicious rituals and turmeric for blessing and glow.",
    code: "Haldi Hues",
    mood: "Sun-warm yellows and whites — turmeric is in the air.",
    key: "#DD6166",
    palette: [
      { name: "Green", hex: "#5E9E54" },
      { name: "White", hex: "#F4EFE2" },
      { name: "Bougainvillea Rose", hex: "#B55756" },
      { name: "Bougainvillea Pink", hex: "#DD6166" },
      { name: "Bougainvillea Clay", hex: "#C27E79" },
      { name: "Citrus Orange", hex: "#F0832B" },
      { name: "Blue", hex: "#2E6CB0" },
    ],
    women: "Light cotton or organza in yellow — you will be dusted in haldi.",
    men: "A simple kurta you do not mind staining; whites and yellows.",
    avoid: "Anything precious — haldi stains for keeps.",
  },
  {
    id: "sangeet",
    name: "Sangeet",
    host: null,
    date: "Jan 4",
    dayNum: "04",
    day: "Monday",
    time: "Evening",
    icon: Music,
    blurb: "An evening of music, dance performances and celebration.",
    code: "Jewel & Shine",
    mood: "Rich jewel tones and metallics — the glam night.",
    key: "#2C4C8C",
    palette: [
      { name: "Black", hex: "#171514" },
      { name: "Sapphire Blue", hex: "#2C4C8C" },
      { name: "Morganite Pink", hex: "#E3B7AC" },
      { name: "Emerald Green", hex: "#1C7A5B" },
    ],
    women: "A floor-length gown or heavy lehenga — this is the night to shine.",
    men: "A bandhgala, indo-western, or deep-toned kurta with a Nehru jacket.",
    avoid: "Daytime pastels — go rich and shimmering.",
  },
  {
    id: "lagna",
    name: "Lagna",
    host: null,
    date: "Jan 5",
    dayNum: "05",
    day: "Tuesday",
    time: "Ceremony",
    icon: Gem,
    blurb: "The sacred ceremony — the pheras and the tying of the knot.",
    code: "Regal Tradition",
    mood: "Classic reds, gold and maroon — formal and ceremonial.",
    key: "#C81D25",
    palette: [
      { name: "Hot Red", hex: "#C81D25" },
      { name: "Leaf Green", hex: "#5A9E3B" },
      { name: "Golden", hex: "#CBA242" },
      { name: "Turmeric Yellow", hex: "#E3A91E" },
      { name: "Vanilla White", hex: "#F0E6CC" },
      { name: "Rajnigandha", hex: "#F4EFE0" },
    ],
    women: "A silk saree or festive lehenga in red, gold, or maroon.",
    men: "A sherwani or silk kurta with a stole — classic and formal.",
    avoid: "Black and stark white — traditionally kept for other occasions.",
  },
]

function eventTitle(ev: Pick<WardrobeEvent, "host" | "name">) {
  return ev.host ? `${ev.host} ${ev.name}` : ev.name
}

export function WardrobePlanner({ wardrobeImages }: { wardrobeImages: WardrobeImages }) {
  const [active, setActive] = useState(0)
  const [gender, setGender] = useState<Gender>("women")
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [slideIndex, setSlideIndex] = useState(0)

  // Deep links from the EVENTS menu: /wardrobe-planner#<event-id> selects the
  // matching tab and scrolls to the planner (no element carries the hash id).
  useEffect(() => {
    const applyHash = () => {
      const idx = EVENTS.findIndex((e) => e.id === window.location.hash.slice(1))
      if (idx < 0) return
      setActive(idx)
      document.getElementById("wardrobe-planner-events")?.scrollIntoView({ behavior: "smooth" })
    }
    applyHash()
    window.addEventListener("hashchange", applyHash)
    return () => window.removeEventListener("hashchange", applyHash)
  }, [])

  const ev = EVENTS[active]
  const EventIcon = ev.icon
  const images = wardrobeImages[wardrobeFolder(ev.id)]?.[gender] ?? []

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSlideIndex(emblaApi.selectedScrollSnap())
    emblaApi.on("select", onSelect)
    onSelect()
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi])

  // Reset to the first slide whenever the event or gender filter changes the
  // underlying slide list.
  useEffect(() => {
    if (!emblaApi) return
    emblaApi.reInit()
    emblaApi.scrollTo(0)
  }, [emblaApi, images])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const saveLook = useCallback(() => {
    const src = images[slideIndex]
    if (!src) return
    const link = document.createElement("a")
    link.href = src
    link.download = src.split("/").pop() ?? "look.jpeg"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setSaved((s) => ({ ...s, [ev.id]: true }))
  }, [images, slideIndex, ev.id])

  return (
    <section id="wardrobe-planner" className="wp-root scroll-mt-24">
      {/* Hero — same treatment as the Guide page hero */}
      <header className="wp-hero">
        <div className="wp-hero-img" aria-hidden="true" />
        <div className="wp-hero-inner">
          <p className="wp-hero-kicker">~ Wardrobe Planner ~</p>
          <h1 className="wp-hero-title">What to Wear</h1>
          <p className="wp-hero-sub">
            A colour guide for every celebration — five days, five moods. Come dressed for the moment.
          </p>
        </div>
      </header>

      {/* Sticky nav — same treatment as the Itinerary/Guide subnav */}
      <nav className="wp-subnav">
        <div className="wp-subnav-inner">
          <div className="wp-subnav-row">
            <span className="wp-subnav-brand">Events</span>
            <div className="dirA-tabs">
              {EVENTS.map((e, i) => (
                <button
                  key={e.id}
                  type="button"
                  className={"dirA-tab" + (i === active ? " is-active" : "")}
                  onClick={() => setActive(i)}
                  aria-pressed={i === active}
                >
                  <span className="dirA-tab-day">{e.dayNum}</span>
                  <span className="dirA-tab-name">{eventTitle(e)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <div id="wardrobe-planner-events" className="wp-container scroll-mt-24">
        {/* Featured spread */}
        <div className="dirA-spread">
          {/* Left — colour-field mood panel */}
          <div className="dirA-mood-col">
            <div className="wp-label">The Palette</div>
            <div className="dirA-mood">
              <div className="dirA-bands">
                {ev.palette.map((c) => (
                  <div key={c.hex} className="dirA-band" style={{ background: c.hex }}>
                    <span className="dirA-band-name">{c.name}</span>
                  </div>
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
          </div>

          {/* Right — details */}
          <div className="dirA-detail">
            <div className="dirA-meta">
              <span>{ev.day}</span>
              <span className="wp-dot">·</span>
              <span>{ev.date}</span>
              <span className="wp-dot">·</span>
              <span>{ev.time}</span>
            </div>
            <h3 className="dirA-event">{eventTitle(ev)}</h3>

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
          </div>
        </div>

        {/* Style gallery — real reference photos, filterable by gender */}
        <div className="wp-gallery">
          <div className="wp-gallery-head">
            <div className="wp-label">Style Gallery</div>
            <div className="wp-gender-tabs" role="tablist" aria-label="Filter looks by gender">
              <button
                type="button"
                role="tab"
                className={"wp-gender-tab" + (gender === "women" ? " is-active" : "")}
                aria-selected={gender === "women"}
                onClick={() => setGender("women")}
              >
                Women
              </button>
              <button
                type="button"
                role="tab"
                className={"wp-gender-tab" + (gender === "men" ? " is-active" : "")}
                aria-selected={gender === "men"}
                onClick={() => setGender("men")}
              >
                Men
              </button>
            </div>
          </div>

          <div className="wp-carousel">
            {images.length > 0 ? (
              <>
                <div className="wp-carousel-viewport" ref={emblaRef}>
                  <div className="wp-carousel-track">
                    {images.map((src, i) => (
                      <div className="wp-carousel-slide" key={src}>
                        <img
                          src={src}
                          alt={`${eventTitle(ev)} — ${gender === "women" ? "women's" : "men's"} look ${i + 1}`}
                          loading={i === 0 ? "eager" : "lazy"}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {images.length > 1 && (
                  <>
                    <span className="wp-carousel-count">
                      {slideIndex + 1} / {images.length}
                    </span>
                    <button
                      type="button"
                      className="wp-carousel-arrow wp-carousel-arrow-prev"
                      onClick={scrollPrev}
                      aria-label="Previous look"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      className="wp-carousel-arrow wp-carousel-arrow-next"
                      onClick={scrollNext}
                      aria-label="Next look"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className={"wp-btn wp-btn-primary wp-carousel-save" + (saved[ev.id] ? " is-saved" : "")}
                  onClick={saveLook}
                >
                  <Download size={15} strokeWidth={1.6} />
                  {saved[ev.id] ? "Saved to my plan" : "Save this look"}
                </button>
              </>
            ) : (
              <div className="wp-carousel-empty">Photos coming soon.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
