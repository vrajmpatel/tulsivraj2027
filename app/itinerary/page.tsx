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
      <BackButton />
      <Itinerary />
    </main>
  )
}
