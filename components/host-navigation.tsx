import Link from "next/link"
import { signOut } from "@/app/host-login/actions"

export function HostNavigation() {
  return (
    <nav aria-label="Host navigation" className="flex flex-wrap items-center justify-end gap-5 px-6 py-3 text-sm">
      <Link href="/guest-list" className="underline">Guests</Link>
      <Link href="/task-list" className="underline">Tasks</Link>
      <form action={signOut}><button type="submit" className="underline">Sign out</button></form>
    </nav>
  )
}
