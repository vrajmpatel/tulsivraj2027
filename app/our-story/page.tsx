import type { Metadata } from "next"
import { BackButton } from "@/components/back-button"
import { OurStory } from "@/components/our-story"

export const metadata: Metadata = {
  title: "Our Story — 12,530 Kilometers to the Mandap · Tulsi & Vraj's Wedding 2027",
  description:
    "One of us grew up outside Philadelphia, the other in Vadodara. Follow the long-distance story of how Tulsi & Vraj closed the 12,530-kilometer gap — chapter by chapter, all the way to the mandap on January 5, 2027.",
}

export default function OurStoryPage() {
  return (
    <main className="min-h-screen">
      <BackButton />
      <OurStory />
    </main>
  )
}
