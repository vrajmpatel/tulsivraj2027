"use client"

import { useEffect, useState } from "react"

// The wedding (Lagna) is on January 5th, 2027. Months are 0-indexed.
const WEDDING_DATE = new Date(2027, 0, 5, 0, 0, 0)

function getTimeRemaining() {
  // Based on the visitor's own current local time (client-side clock).
  const total = Math.max(WEDDING_DATE.getTime() - Date.now(), 0)
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  }
}

export function Countdown() {
  // Start as null so the server-rendered markup matches the first client paint
  // (the real time is only known on the client), avoiding a hydration mismatch.
  const [time, setTime] = useState<ReturnType<typeof getTimeRemaining> | null>(null)

  useEffect(() => {
    setTime(getTimeRemaining())
    const id = setInterval(() => setTime(getTimeRemaining()), 1000)
    return () => clearInterval(id)
  }, [])

  const units = [
    { label: "Days", value: time?.days },
    { label: "Hours", value: time?.hours },
    { label: "Minutes", value: time?.minutes },
    { label: "Seconds", value: time?.seconds },
  ]

  return (
    <section className="relative overflow-hidden py-20">
      {/* Indian mango wallpaper */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/indian_mango.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "480px",
        }}
        aria-hidden="true"
      />

      <div
        className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white lg:px-8"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35), 0 3px 16px rgba(0,0,0,0.3)" }}
      >
        <h2 className="font-serif text-3xl tracking-wide sm:text-4xl">
          Counting down to our wedding
        </h2>

        <div className="mt-10 flex items-start justify-center gap-8 sm:gap-14">
          {units.map((unit) => (
            <div key={unit.label} className="flex min-w-[64px] flex-col items-center sm:min-w-[92px]">
              <span className="font-serif text-5xl leading-none tabular-nums sm:text-7xl">
                {unit.value === undefined ? "--" : String(unit.value).padStart(2, "0")}
              </span>
              <span className="mt-2 font-serif text-[10px] uppercase tracking-[0.3em] sm:text-xs">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
