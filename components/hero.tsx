"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"

import { RsvpDialog } from "@/components/rsvp-dialog"

export function Hero() {
  const [atTop, setAtTop] = useState(true)

  useEffect(() => {
    function handleScroll() {
      setAtTop(window.scrollY < 80)
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  function scrollToCountdown() {
    document.getElementById("countdown")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative min-h-screen pb-8">
      {/* Background image */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="/SMT063.jpg" 
          alt="Tulsi & Vraj Background" 
          className="h-[173%] w-full object-cover -translate-y-[42%]" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center lg:px-8">
        <h1
          className="flex w-full flex-col items-center justify-center text-white transform translate-y-[8vh]"
          style={{ textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}
        >
          <div
            className="flex w-3/5 sm:w-3/4 justify-between font-oranienbaum text-3xl sm:text-5xl md:text-7xl lg:text-[80px] uppercase font-normal text-zinc-300 opacity-60"
            aria-label="TULSI & VRAJ"
          >
            {Array.from("TULSI & VRAJ").map((char, index) => (
              <span key={index} aria-hidden="true">
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </div>
          <span className="mt-4 font-serif text-sm tracking-[0.3em] uppercase opacity-90 lg:text-base">
            Jan 5th 2027 • Vadodara
          </span>
        </h1>

        <div className="mt-10 transform translate-y-[8vh]">
          <RsvpDialog />
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToCountdown}
        aria-label="Scroll down to the countdown"
        className={`absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5 text-black/70 transition-opacity duration-500 hover:text-black cursor-pointer ${
          atTop ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span className="font-serif text-xs tracking-[0.3em] uppercase">Countdown With Us!</span>
        <ChevronDown className="h-5 w-5 animate-bounce" />
      </button>
    </section>
  )
}
