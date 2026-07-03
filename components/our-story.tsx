"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import {
  Gem,
  Heart,
  HeartHandshake,
  ImageIcon,
  MessageCircle,
  PencilLine,
  Plane,
  PlaneLanding,
  Repeat,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

// ----------------------------------------------------------------------------
// Content — distilled from the claude.ai/design handoff (project/Our Story.html).
// "7,900 Miles to I Do": the long-distance timeline from Yardley, PA to
// Vadodara, GJ. The chapter copy below is the design's scaffold — dates,
// blurbs, and photo slots are placeholders awaiting the couple's real story.
// ----------------------------------------------------------------------------

const TOTAL_MI = 7900

type Chapter = {
  badge: string
  tone: "pa" | "vad" | "both"
  title: string
  text: string
  placeholder?: boolean
  photo?: string
  icon: LucideIcon
  date: string
  milestone?: boolean
}

const CHAPTERS: Chapter[] = [
  {
    badge: "The Beginning", tone: "both", icon: Sparkles, date: "[Month 20XX]",
    title: "[How you two first “met”]",
    text: "Placeholder — the app, the setup, the mutual friend, the chance encounter. However it started, this is where chapter one begins.",
    placeholder: true,
    photo: "Drop a photo from around this time",
  },
  {
    badge: "Long Distance, Round One", tone: "both", icon: MessageCircle, date: "[Month 20XX]",
    title: "[The 10.5-hour time-zone gap begins]",
    text: "Placeholder — early calls at odd hours, the first “good morning” that was actually goodnight, learning each other from two continents away.",
    placeholder: true,
  },
  {
    badge: "Vadodara", tone: "vad", icon: PlaneLanding, date: "[Month 20XX]", milestone: true,
    title: "[The first trip to meet in person]",
    text: "Placeholder — who flew where, how long the flight felt, and the moment it became real.",
    placeholder: true,
    photo: "Drop a photo from the first visit",
  },
  {
    badge: "Back & Forth", tone: "both", icon: Repeat, date: "[Month 20XX]",
    title: "[The visits that followed]",
    text: "Placeholder — the trips, the airport goodbyes, the growing certainty that the distance was temporary.",
    placeholder: true,
  },
  {
    badge: "The Decision", tone: "both", icon: HeartHandshake, date: "[Month 20XX]", milestone: true,
    title: "[Choosing to close the gap for good]",
    text: "Placeholder — the conversation about a future in the same city, the same time zone, the same home.",
    placeholder: true,
    photo: "Drop a photo here",
  },
  {
    badge: "The Proposal", tone: "both", icon: Gem, date: "[Month 20XX]", milestone: true,
    title: "[Where and how it happened]",
    text: "Placeholder — the setting, the surprise (or lack thereof), and the moment “long distance” became “engaged.”",
    placeholder: true,
    photo: "Drop the proposal photo",
  },
  {
    badge: "Vadodara · Jan 2027", tone: "vad", icon: Heart, date: "Jan 5, 2027", milestone: true,
    title: "Zero miles apart",
    text: "The gap that once measured 7,900 miles and 10.5 time zones closes for good — under one mandap, in one city, together at last.",
  },
]

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export function OurStory() {
  const fillRef = useRef<HTMLDivElement>(null)
  const planeRef = useRef<HTMLDivElement>(null)
  const milesRef = useRef<HTMLSpanElement>(null)
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
    // scrolls top to bottom, counting down from 7,900 mi to 0. Direct DOM
    // writes to avoid re-rendering on scroll.
    const updateMeter = () => {
      if (!fillRef.current || !planeRef.current || !milesRef.current || !stateRef.current) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      let progress = max > 0 ? window.scrollY / max : 0
      progress = Math.max(0, Math.min(1, progress))

      const pct = (progress * 100).toFixed(2)
      fillRef.current.style.width = pct + "%"
      planeRef.current.style.left = pct + "%"

      const miles = Math.round(TOTAL_MI * (1 - progress))
      milesRef.current.textContent = miles.toLocaleString() + " mi"
      stateRef.current.textContent = progress >= 0.995 ? "together" : "apart"
    }

    window.addEventListener("scroll", updateMeter, { passive: true })
    window.addEventListener("resize", updateMeter)
    updateMeter()

    return () => {
      ro.disconnect()
      window.removeEventListener("scroll", updateMeter)
      window.removeEventListener("resize", updateMeter)
    }
  }, [])

  return (
    <div className="story-root">
      {/* Hero */}
      <header className="hero">
        <div className="wrap">
          <p className="hero-kicker">~ Our Story ~</p>
          <h1 className="hero-title">
            7,900 Miles
            <br />
            to the Mandap
          </h1>
          <p className="hero-sub">
            One of us grew up outside Philadelphia. The other, in Vadodara. Here&apos;s the (very
            long-distance) story of how we closed the gap.
          </p>

          <div className="route-stat">
            <b>10.5 time zones</b> · countless texts
          </div>
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
                <Plane size={18} strokeWidth={1.6} />
              </div>
            </div>
            <div className="meter-city right">
              <span>Vadodara, GJ</span>
              <span className="sub">Where she&apos;s from</span>
            </div>
            <div className="meter-num">
              <span ref={milesRef}>7,900 mi</span>
              <span ref={stateRef}>apart</span>
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
              Scroll along — the mile-o-meter above counts down as our story does. Every milestone
              here is a placeholder; swap in your own dates, photos, and words.
            </p>
          </div>

          <div className="edit-note reveal">
            <PencilLine size={16} strokeWidth={1.6} />
            <span>
              Everything below is a scaffold — dates, blurbs, and photo slots are placeholders.
              Replace the italic text with your real story, drop photos into the picture frames, and
              delete/add chapters as needed.
            </span>
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
                <div className={"story-item" + (c.milestone ? " is-milestone" : "")} key={i}>
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
            0 miles<span>Forever, starting Jan 5, 2027</span>
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
