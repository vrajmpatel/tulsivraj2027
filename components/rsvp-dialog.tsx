"use client"

import { useState } from "react"
import { toast } from "sonner"

import { createClient } from "@/utils/supabase/client"
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

export function RsvpDialog() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    attending: "yes",
    guest_count: "1",
    message: "",
  })

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
    const supabase = createClient()

    const { error } = await supabase.from("rsvp").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      attending: form.attending === "yes",
      guest_count: Number(form.guest_count) || 1,
      message: form.message.trim() || null,
    })

    setSubmitting(false)

    if (error) {
      toast.error("Something went wrong. Please try again.")
      console.error("RSVP insert failed:", error)
      return
    }

    toast.success("Thank you! Your RSVP has been received.")
    setForm({
      full_name: "",
      email: "",
      phone: "",
      attending: "yes",
      guest_count: "1",
      message: "",
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="mt-10 border border-white/70 bg-white/10 px-10 font-serif text-sm uppercase tracking-[0.3em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black"
        >
          RSVP
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
          <div className="grid gap-2">
            <Label htmlFor="rsvp-name">Full name</Label>
            <Input
              id="rsvp-name"
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              placeholder="Your name"
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
