"use client"

import { useState } from "react"
import { Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { RSVP_LIMITS } from "@/lib/rsvp-schema"

const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone: "",
  attending: "yes",
  guest_count: "1",
  message: "",
  // Honeypot -- hidden from people, so anything here means a bot filled it in.
  website: "",
}

export function RsvpDialog() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.full_name.trim()) {
      toast.error("Please enter your name.")
      return
    }

    setSubmitting(true)

    let res: Response
    try {
      res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          attending: form.attending === "yes",
          guest_count: Number(form.guest_count) || 1,
          message: form.message.trim() || null,
          website: form.website,
        }),
      })
    } catch (err) {
      setSubmitting(false)
      toast.error("Something went wrong. Please try again.")
      console.error("RSVP request failed:", err)
      return
    }

    const data = await res.json().catch(() => ({}))
    setSubmitting(false)

    // Already in the system — they've RSVP'd before. Let them know, gently.
    if (res.status === 409 || data?.duplicate) {
      toast.info(
        data?.message ??
          "It looks like you're already on our list — we've got your RSVP!",
      )
      setOpen(false)
      return
    }

    // Rate limited -- they've submitted several times already.
    if (res.status === 429) {
      toast.error(
        data?.error ??
          "You've sent a few RSVPs already. Please try again later, or reach out to us directly.",
      )
      return
    }

    if (!res.ok) {
      toast.error(data?.error ?? "Something went wrong. Please try again.")
      console.error("RSVP submit failed:", data)
      return
    }

    toast.success("Thank you! Your RSVP has been received.")
    setForm(EMPTY_FORM)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 pl-5 pr-2.5 py-2 font-serif text-xs tracking-[0.25em] uppercase text-white shadow-md backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 cursor-pointer h-10"
        >
          <Mail className="w-4 h-4 text-gray-300 shrink-0" />
          <span>RSVP</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl tracking-wide">RSVP</DialogTitle>
          <DialogDescription>
            We&apos;d love to celebrate with you. Please let us know if you can make it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/*
            Honeypot. Off-screen rather than display:none, since some bots skip
            fields they can tell are hidden. No person will ever fill this in.
          */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
            <Label htmlFor="rsvp-website">Website</Label>
            <Input
              id="rsvp-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rsvp-name">Full name</Label>
            <Input
              id="rsvp-name"
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              placeholder="Your name"
              maxLength={RSVP_LIMITS.fullName}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rsvp-email">Email</Label>
            <Input
              id="rsvp-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              maxLength={RSVP_LIMITS.email}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rsvp-phone">Phone</Label>
            <Input
              id="rsvp-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="Optional"
              maxLength={RSVP_LIMITS.phone}
            />
          </div>

          <div className="grid gap-2">
            <Label>Will you be attending?</Label>
            <RadioGroup
              value={form.attending}
              onValueChange={(value) => update("attending", value)}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="attending-yes" />
                <Label htmlFor="attending-yes" className="font-normal">
                  Joyfully accepts
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="attending-no" />
                <Label htmlFor="attending-no" className="font-normal">
                  Regretfully declines
                </Label>
              </div>
            </RadioGroup>
          </div>

          {form.attending === "yes" && (
            <div className="grid gap-2">
              <Label htmlFor="rsvp-guests">Number of guests (including you)</Label>
              <Input
                id="rsvp-guests"
                type="number"
                min={1}
                max={RSVP_LIMITS.guestCount}
                value={form.guest_count}
                onChange={(e) => update("guest_count", e.target.value)}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="rsvp-message">Message / dietary notes</Label>
            <Textarea
              id="rsvp-message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder="Anything you'd like us to know"
              maxLength={RSVP_LIMITS.message}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Send RSVP"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
