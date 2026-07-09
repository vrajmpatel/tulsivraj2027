import fs from "node:fs"
import path from "node:path"
import type { Metadata } from "next"
import { BackButton } from "@/components/back-button"
import { WardrobePlanner, type WardrobeImages } from "@/components/wardrobe-planner"

export const metadata: Metadata = {
  title: "Wardrobe Planner — Tulsi & Vraj's Wedding 2027",
  description:
    "What to wear for every celebration — a colour and dress-code guide for each of the five wedding events.",
}

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i

// Reads public/wardrobe/<event-folder>/<men|women>/*.jpeg so new photos just
// need to be dropped into the right folder — no code changes required.
function readWardrobeImages(): WardrobeImages {
  const root = path.join(process.cwd(), "public", "wardrobe")
  const images: WardrobeImages = {}

  let folders: string[] = []
  try {
    folders = fs
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  } catch {
    return images
  }

  for (const folder of folders) {
    images[folder] = { men: [], women: [] }
    for (const gender of ["men", "women"] as const) {
      const dir = path.join(root, folder, gender)
      try {
        images[folder][gender] = fs
          .readdirSync(dir)
          .filter((file) => IMAGE_EXT.test(file))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
          .map((file) => `/wardrobe/${folder}/${gender}/${file}`)
      } catch {
        // No photos for this event/gender yet.
      }
    }
  }

  return images
}

export default function WardrobePlannerPage() {
  const wardrobeImages = readWardrobeImages()

  return (
    <main className="min-h-screen">
      <BackButton />
      <WardrobePlanner wardrobeImages={wardrobeImages} />
    </main>
  )
}
