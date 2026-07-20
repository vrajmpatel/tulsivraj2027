import type { Metadata } from "next"
import { BackButton } from "@/components/back-button"
import { Itinerary } from "@/components/itinerary"

export const metadata: Metadata = {
  title: "The Wedding Day — Itinerary · Tulsi & Vraj's Wedding 2027",
  description:
    "How the wedding day unfolds at Aambaug, Vadodara on Tuesday, January 5, 2027 — a guest's timeline from the baraat through the sunset varmala to the ceremony, reception, and farewell.",
}

export default function ItineraryPage() {
  return (
    <main className="min-h-screen">
      <BackButton className="font-sans text-[13px] font-medium normal-case tracking-[0.02em] px-[15px] py-2 text-[oklch(0.52_0.012_70)] hover:text-[oklch(0.27_0.012_70)]" />
      <Itinerary />
    </main>
  )
}
