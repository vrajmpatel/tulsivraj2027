import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { HostLoginForm } from "@/components/host-login-form"
import { getHostUser, hostDestination } from "@/lib/host-auth"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Host sign in",
  robots: { index: false, follow: false, nocache: true },
}

export default async function HostLoginPage({ searchParams }: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const destination = hostDestination((await searchParams).next)
  if (await getHostUser()) redirect(destination)
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tulsi &amp; Vraj</p>
        <h1 className="mt-3 font-serif text-4xl">Host sign in</h1>
        <p className="mt-4 text-sm text-muted-foreground">Sign in with your host account to manage guests and wedding tasks.</p>
        <HostLoginForm destination={destination} />
        <Link href="/" className="mt-6 block text-center text-sm underline">Back to the wedding website</Link>
      </section>
    </main>
  )
}
