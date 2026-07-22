import type { Metadata } from "next"
import { BackButton } from "@/components/back-button"
import { VadodaraMap } from "@/components/vadodara-map"

export const metadata: Metadata = {
  title: "Vadodara Map · Tulsi & Vraj's Wedding 2027",
  description:
    "A map of Vadodara, Gujarat — the wedding venue, sangeet venue, recommended hotels, airport, and railway station for Tulsi & Vraj's wedding.",
}

export default function VadodaraPage() {
  return (
    <main className="min-h-screen">
      <BackButton />
      <VadodaraMap />
    </main>
  )
}
