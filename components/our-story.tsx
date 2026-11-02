"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import {
  Gem,
  Heart,
  HeartHandshake,
  ImageIcon,
  MessageCircle,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Repeat,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

// ----------------------------------------------------------------------------
// Content — distilled from the claude.ai/design handoff (project/Our Story.html).
// "12,530 Kilometers to I Do": the long-distance timeline from Yardley, PA to
// Vadodara, GJ. The chapter copy below is the design's scaffold — dates,
// blurbs, and photo slots are placeholders awaiting the couple's real story.
// ----------------------------------------------------------------------------

const TOTAL_KM = 12530

type Chapter = {
  badge: string
  tone: "pa" | "vad" | "both"
  title: string
  text: string
  placeholder?: boolean
  photo?: string
  /** A real photo, rendered in place of the dashed `photo` placeholder. */
  image?: { src: string; alt: string }
  icon: LucideIcon
  date: string
  milestone?: boolean
  /** Swaps the dark milestone card for the site's light forest green. */
  accent?: "green"
}

const CHAPTERS: Chapter[] = [
  {
    badge: "The Beginning", tone: "both", icon: Sparkles, date: "May 2023",
    title: "The first conversation",
    text: "Tulsi and Vraj first started talking via a Whatsapp phone call. Vraj received Tulsi's number and decided to make the first call in a Cupertino, CA public park in the Spring of 2023. It was a beautiful day outside and Vraj was partially nervous and indifferent to start the conversation because he didn't know what to expect. He honestly thought that this relationship might not go that far because of the long distance and different upbringings they both had. However, Vraj was immediately charmed by Tulsi's voice and down-to-earth nature. Tulsi was also not expecting much from the conversation and felt the relationship wouldn't go anywhere. Nevertheless, both Vraj and Tulsi felt that it was worth a try and one conversation wouldn't hurt. That first conversation helped them realize the surprising similarities in their world view and family structure. The story had started but it keep reading to see how it unfolds... :)",
    image: { src: "/whatsapp_video.jpeg", alt: "Tulsi and Vraj's first WhatsApp call" },
  },
  {
    badge: "Long Distance, Round One", tone: "both", icon: MessageCircle, date: "June 2023",
    title: "[The 10.5-hour time-zone gap begins]",
    text: "Placeholder — early calls at odd hours, the first “good morning” that was actually goodnight, learning each other from two continents away.",
    placeholder: true,
    image: { src: "/IMG_7305.PNG", alt: "Tulsi drying her hair during a video call with Vraj." },
  },
  {
    badge: "Vadodara", tone: "vad", icon: PlaneLanding, date: "Nov 2024", milestone: true,
    title: "[The first trip to meet in person]",
    text: "Placeholder — who flew where, how long the flight felt, and the moment it became real.",
    placeholder: true,
    image: { src: "/old_school.jpeg", alt: "The first trip to meet in person" },
  },
  {
    badge: "Back & Forth", tone: "both", icon: Repeat, date: "Dec 2024",
    title: "[The visits that followed]",
    text: "Placeholder — the trips, the airport goodbyes, the growing certainty that the distance was temporary.",
    placeholder: true,
    image: { src: "/baroda_kayak.jpeg", alt: "The visits that followed" },
  },
  {
    badge: "The Decision", tone: "both", icon: HeartHandshake, date: "March 2025", milestone: true,
    title: "[Choosing to close the gap for good]",
    text: "Placeholder — the conversation about a future in the same city, the same time zone, the same home.",
    placeholder: true,
    image: { src: "/first_gift.jpg", alt: "First gift milestone photo" },
  },
  {
    badge: "The Proposal", tone: "both", icon: Gem, date: "April 2025", milestone: true,
    title: "[Where and how it happened]",
    text: "Placeholder — the setting, the surprise (or lack thereof), and the moment “long distance” became “engaged.”",
    placeholder: true,
    accent: "green",
    image: { src: "/SMT0123.jpg", alt: "The two of us just after the proposal, the ring on her hand." },
  },
  {
    badge: "Vadodara · Jan 2027", tone: "vad", icon: Heart, date: "Jan 5, 2027", milestone: true,
    title: "Zero kilometers apart",
    text: "The gap that once measured 12,530 kilometers and 10.5 time zones closes for good — under one mandap, in one city, together at last.",
    image: { src: "/hawa_mahal.jpeg", alt: "Zero kilometers apart" },
  },
]

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export function OurStory() {
  const fillRef = useRef<HTMLDivElement>(null)
  const planeRef = useRef<HTMLDivElement>(null)
  const distRef = useRef<HTMLSpanElement>(null)
  const stateRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = document.querySelector(".story-root")
    if (!root) return

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

    // Scroll-linked distance meter — the plane flies dot to dot as the page
    // scrolls top to bottom, reading exactly 12,530 km at the very top and
    // exactly 0 km once the page cannot scroll any further. The scrollable
    // range is re-measured every time we paint rather than cached, so a
    // collapsing mobile URL bar, a rotated phone, a resized window, or
    // late-loading images can never leave the meter short of either end.
    // Direct DOM writes to avoid re-rendering on scroll.
    let frame = 0

    const paint = () => {
      frame = 0
      const fill = fillRef.current
      const plane = planeRef.current
      const dist = distRef.current
      const state = stateRef.current
      if (!fill || !plane || !dist || !state) return

      const doc = document.documentElement
      // clientHeight — not innerHeight — is the viewport the document actually
      // scrolls inside, so `max` equals the browser's own maximum scroll
      // offset (innerHeight includes the mobile toolbar area and any
      // horizontal scrollbar, which would leave a gap we could never reach).
      const max = doc.scrollHeight - doc.clientHeight
      const y = window.scrollY || doc.scrollTop || 0

      // Snap the first/last couple of pixels: fractional scroll positions,
      // non-integer device pixel ratios, browser zoom, and rubber-band
      // overscroll all mean `y` rarely lands exactly on 0 or on `max`.
      const EDGE = 2
      let progress: number
      if (max <= EDGE || y <= EDGE) progress = 0
      else if (y >= max - EDGE) progress = 1
      else progress = y / max

      const pct = (progress * 100).toFixed(2)
      fill.style.width = pct + "%"
      plane.style.left = pct + "%"
      plane.classList.toggle("is-visible", progress > 0)
      plane.classList.toggle("is-landing", progress >= 0.5)

      // 0 km is reserved for the true bottom of the page — anything above it
      // rounds up to at least 1 km so the readout and the "apart" label agree.
      const km = progress >= 1 ? 0 : Math.max(1, Math.round(TOTAL_KM * (1 - progress)))
      dist.textContent = km.toLocaleString("en-US") + " km"
      state.textContent = progress >= 1 ? "together" : "apart"
    }

    // Coalesce bursts of scroll/resize events into one measurement per frame.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }

    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    window.addEventListener("orientationchange", schedule)
    window.addEventListener("load", schedule)
    window.visualViewport?.addEventListener("resize", schedule)
    window.visualViewport?.addEventListener("scroll", schedule)
    // Background tabs get no animation frames and deferred scroll events, and
    // a back/forward restore hands us a scroll position with no event at all —
    // so re-measure whenever the page becomes visible again.
    document.addEventListener("visibilitychange", schedule)
    window.addEventListener("pageshow", schedule)

    // Layout shifts that change the page height without firing scroll/resize
    // (web fonts, the hero photo decoding, reveal animations landing).
    const so = new ResizeObserver(schedule)
    so.observe(document.body)
    document.fonts?.ready.then(schedule).catch(() => {})

    paint()

    return () => {
      ro.disconnect()
      so.disconnect()
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      window.removeEventListener("orientationchange", schedule)
      window.removeEventListener("load", schedule)
      window.visualViewport?.removeEventListener("resize", schedule)
      window.visualViewport?.removeEventListener("scroll", schedule)
      document.removeEventListener("visibilitychange", schedule)
      window.removeEventListener("pageshow", schedule)
    }
  }, [])

  return (
    <div className="story-root">
      {/* Hero */}
      <header className="hero">
        <div className="hero-img" aria-hidden="true" />
        <div className="wrap hero-inner">
          <p className="hero-kicker">~ Our Story ~</p>
          <h1 className="hero-title">
            12,530 Kilometers
            <br />
            to the Mandap
          </h1>
        </div>
      </header>

      {/* Sticky distance meter */}
      <div className="meter-wrap">
        <div className="wrap">
          <div className="meter-row">
            <div className="meter-city">
              <span>Yardley, PA</span>
              <span className="sub">Where he&apos;s from</span>
            </div>
            <div className="meter-track">
              <div className="meter-fill" ref={fillRef} />
              <span className="meter-end start" aria-hidden="true" />
              <span className="meter-end end" aria-hidden="true" />
              <div className="meter-plane" ref={planeRef}>
                <PlaneTakeoff className="ico-takeoff" size={18} strokeWidth={1.6} />
                <Plane className="ico-land" size={18} strokeWidth={1.6} />
              </div>
            </div>
            <div className="meter-city right">
              <span>Vadodara, GJ</span>
              <span className="sub">Where she&apos;s from</span>
            </div>
            <div className="meter-num">
              <span className="val" ref={distRef}>12,530 km</span>
              <span className="state" ref={stateRef}>apart</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <section className="sec" id="story">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Chapter by Chapter</span>
            <h2 className="sec-title">How the distance closed</h2>
            <p className="sec-intro">
              Scroll along — the distance meter above counts down as our story does. Every milestone
              here is a placeholder; swap in your own dates, photos, and words.
            </p>
          </div>

          <div className="story-tl">
            {CHAPTERS.map((c, i) => {
              const Icon = c.icon
              const card = (
                <div className="side" key="card">
                  <div className="story-card">
                    <span className={`story-badge ${c.tone}`}>{c.badge}</span>
                    <h4>{c.title}</h4>
                    <p className={c.placeholder ? "ph" : undefined}>{c.text}</p>
                    {c.image && (
                      <div className="story-photo">
                        <img src={c.image.src} alt={c.image.alt} loading="lazy" />
                      </div>
                    )}
                    {c.photo && (
                      <div className="photo-slot">
                        <ImageIcon size={18} strokeWidth={1.6} />
                        <span>{c.photo}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
              const marker = (
                <div className="story-marker" key="marker">
                  <div className="story-dot">
                    <Icon size={20} strokeWidth={1.6} />
                  </div>
                  <span className="story-date">{c.date}</span>
                </div>
              )
              const empty = <div className="side empty" key="empty" />
              return (
                <div
                  className={
                    "story-item" +
                    (c.milestone ? " is-milestone" : "") +
                    (c.accent === "green" ? " is-green" : "")
                  }
                  key={i}
                >
                  {i % 2 === 0 ? [card, marker, empty] : [empty, marker, card]}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Finale */}
      <footer className="finale sec alt">
        <div className="finale-tex" aria-hidden="true" />
        <div className="wrap finale-inner">
          <div className="flo">❀ ❀ ❀</div>
          <p>We can&apos;t wait to celebrate with you.</p>
          <div className="finale-stat">
            0 kilometers<span>Forever, starting Jan 5, 2027</span>
          </div>
          <div className="finale-links">
            <Link href="/itinerary">The Wedding Day</Link>
            <Link href="/guide">Travel Guide</Link>
            <Link href="/wardrobe-planner">Wardrobe Planner</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
