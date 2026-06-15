import type { Metadata } from "next"
import { BackButton } from "@/components/back-button"
import { TravelGuide } from "@/components/travel-guide"

export const metadata: Metadata = {
  title: "Travel Guide — Vadodara · Tulsi & Vraj's Wedding 2027",
  description:
    "A guest's guide to Vadodara, Gujarat — travel logistics, where to stay, getting around, things to do, where to eat, and key contacts for Tulsi & Vraj's wedding.",
}

export default function GuidePage() {
  return (
    <main className="min-h-screen">
      <BackButton />
      <TravelGuide />
    </main>
  )
}
