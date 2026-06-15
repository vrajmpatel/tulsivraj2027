import type { Metadata } from "next"
import { BackButton } from "@/components/back-button"
import { WardrobePlanner } from "@/components/wardrobe-planner"

export const metadata: Metadata = {
  title: "Wardrobe Planner — Tulsi & Vraj's Wedding 2027",
  description:
    "What to wear for every celebration — a colour and dress-code guide for each of the five wedding events.",
}

export default function WardrobePlannerPage() {
  return (
    <main className="min-h-screen">
      <BackButton />
      <WardrobePlanner />
    </main>
  )
}
