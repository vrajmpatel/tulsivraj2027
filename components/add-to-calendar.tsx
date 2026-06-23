"use client"

import { CalendarPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Wedding (Lagna) details — all-day event on January 5th, 2027.
const EVENT = {
  title: "Tulsi & Vraj's Wedding",
  description: "Join us as we celebrate Tulsi & Vraj tying the knot!",
  location: "Vadodara, Gujarat, India",
  // All-day event: end date is exclusive, so it spans Jan 5 only.
  start: "20270105",
  end: "20270106",
}

function googleCalendarUrl() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT.title,
    dates: `${EVENT.start}/${EVENT.end}`,
    details: EVENT.description,
    location: EVENT.location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// Builds an .ics file that Apple Calendar, Outlook, etc. can import.
function downloadIcs() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//tulsivraj2027//Wedding//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:wedding-2027-01-05@tulsivraj2027",
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${EVENT.start}`,
    `DTEND;VALUE=DATE:${EVENT.end}`,
    `SUMMARY:${EVENT.title}`,
    `DESCRIPTION:${EVENT.description}`,
    `LOCATION:${EVENT.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "tulsi-vraj-wedding.ics"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function AddToCalendar() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-full border-black/15 bg-transparent px-4 py-2 font-serif text-[11px] tracking-[0.25em] uppercase text-black/70 transition-all hover:bg-black/5 active:scale-95 cursor-pointer h-9"
        >
          <CalendarPlus className="w-4 h-4 shrink-0" />
          <span>Save the Date</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" className="font-serif tracking-wide">
        <DropdownMenuItem
          asChild
          className="cursor-pointer focus:!bg-green-600 focus:!text-white"
        >
          <a href={googleCalendarUrl()} target="_blank" rel="noopener noreferrer">
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={downloadIcs}
          className="cursor-pointer focus:!bg-green-600 focus:!text-white"
        >
          Apple Calendar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
