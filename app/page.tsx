import { Nav } from "@/components/nav"
import { Hero } from "@/components/hero"
import { Countdown } from "@/components/countdown"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Nav />
      <Hero />
      <Countdown />
    </main>
  )
}
