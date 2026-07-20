import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Floating "back to the main page" pill, shared by the standalone sub-pages
 * (/guide, /wardrobe-planner). Fixed top-left, glass styling so it reads on
 * both the dark Guide hero and the light cream sections.
 */
export function BackButton({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      className={cn(
        "fixed left-4 top-4 sm:left-6 z-[70] inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/70 px-4 py-2 font-serif text-[11px] tracking-[0.2em] uppercase text-stone-700 shadow-lg backdrop-blur-md transition-all hover:bg-white/90 hover:text-[var(--hover-blue-deep)] active:scale-95",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      Home
    </Link>
  )
}
