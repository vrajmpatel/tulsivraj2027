"use client"

import { useActionState } from "react"
import { signIn } from "@/app/host-login/actions"

export function HostLoginForm({ destination }: { destination: string }) {
  const [state, action, pending] = useActionState(signIn, { error: null })
  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={destination} />
      <div>
        <label htmlFor="host-email" className="block text-sm font-medium">Email</label>
        <input id="host-email" name="email" type="email" autoComplete="username" required maxLength={254}
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-3" />
      </div>
      <div>
        <label htmlFor="host-password" className="block text-sm font-medium">Password</label>
        <input id="host-password" name="password" type="password" autoComplete="current-password" required maxLength={1024}
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-3" />
      </div>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <button type="submit" disabled={pending}
        className="w-full rounded-md bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  )
}
