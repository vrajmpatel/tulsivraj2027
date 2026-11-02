"use client"

import Link from "next/link"
import { Flower2, Sun, Music, Heart, Compass, Shirt, BookOpen, MapPin, CircleHelp, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function Nav() {
  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-stone-900/20 to-transparent backdrop-blur-xs">
        <div className="w-full px-4 sm:px-6">
          <div className="flex h-20 items-center justify-between">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline"
                  className="flex items-center justify-center gap-1.5 rounded-full border border-white/60 bg-white/80 pl-1 pr-4 py-2 font-serif text-xs tracking-[0.25em] uppercase text-[oklch(0.46_0.10_120)] shadow-md backdrop-blur-md transition-all hover:bg-white/90 hover:text-[oklch(0.52_0.07_78)] active:text-[oklch(0.52_0.07_78)] active:scale-95 cursor-pointer h-10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/favicon_io/events-icon-green.png"
                    alt=""
                    className="w-8 h-8 rounded-full object-contain shrink-0"
                  />
                  <span>EVENTS</span>
                </Button>
              </PopoverTrigger>

              <PopoverContent 
                align="start"
                className="bg-white/10 border-white/20 backdrop-blur-md text-white w-[calc(100vw-2rem)] sm:w-[24rem] rounded-2xl p-4 shadow-2xl font-serif"
              >
                <Accordion type="single" collapsible className="w-full">
                  {/* Mehendi */}
                  <AccordionItem value="mehendi" className="border-white/10">
                    <AccordionTrigger className="hover:no-underline hover:bg-white/5 px-2 py-2 rounded-lg text-sm text-white font-medium group">
                      <span className="flex items-center gap-3">
                        <Flower2 className="w-4 h-4 text-pink-300 shrink-0" />
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <span>Mehendi</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] text-white font-serif tracking-[0.15em] uppercase font-normal whitespace-nowrap">
                            | Jan. 2nd 2027 Sat
                          </span>
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pt-1 pb-3 text-xs text-white/80 leading-relaxed">
                      <p>Traditional henna application, music, and dance celebration with family and friends.</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <Link
                          href="/itinerary#mehendi"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase text-white/90 transition-colors hover:bg-white/20 hover:text-white"
                        >
                          <Clock className="w-3 h-3 text-pink-300 shrink-0" />
                          Itinerary
                        </Link>
                        <Link
                          href="/wardrobe-planner#mehendi"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase text-white/90 transition-colors hover:bg-white/20 hover:text-white"
                        >
                          <Shirt className="w-3 h-3 text-pink-300 shrink-0" />
                          What to Wear
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Vidhi & Haldi - Bride */}
                  <AccordionItem value="haldi-bride" className="border-white/10">
                    <AccordionTrigger className="hover:no-underline hover:bg-white/5 px-2 py-2 rounded-lg text-sm text-white font-medium group">
                      <span className="flex items-center gap-3">
                        <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <span>Tulsi&apos;s Vidhi & Haldi</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] text-white font-serif tracking-[0.15em] uppercase font-normal whitespace-nowrap">
                            | Jan. 3rd 2027 Sun
                          </span>
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pt-1 pb-3 text-xs text-white/80 leading-relaxed">
                      <p>Auspicious rituals and applying turmeric paste for purification and blessing.</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <Link
                          href="/itinerary#haldi-tulsi"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase text-white/90 transition-colors hover:bg-white/20 hover:text-white"
                        >
                          <Clock className="w-3 h-3 text-amber-300 shrink-0" />
                          Itinerary
                        </Link>
                        <Link
                          href="/wardrobe-planner#haldi-tulsi"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase text-white/90 transition-colors hover:bg-white/20 hover:text-white"
                        >
                          <Shirt className="w-3 h-3 text-amber-300 shrink-0" />
                          What to Wear
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Vidhi & Haldi - Groom */}
                  <AccordionItem value="haldi-groom" className="border-white/10">
                    <AccordionTrigger className="hover:no-underline hover:bg-white/5 px-2 py-2 rounded-lg text-sm text-white font-medium group">
                      <span className="flex items-center gap-3">
                        <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <span>Vraj&apos;s Vidhi & Haldi</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] text-white font-serif tracking-[0.15em] uppercase font-normal whitespace-nowrap">
                            | Jan. 4th 2027 Mon
                          </span>
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pt-1 pb-3 text-xs text-white/80 leading-relaxed">
                      <p>Auspicious rituals and applying turmeric paste for purification and blessing.</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <Link
                          href="/itinerary#haldi-vraj"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase text-white/90 transition-colors hover:bg-white/20 hover:text-white"
                        >
                          <Clock className="w-3 h-3 text-amber-300 shrink-0" />
                          Itinerary
                        </Link>
                        <Link
                          href="/wardrobe-planner#haldi-vraj"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase text-white/90 transition-colors hover:bg-white/20 hover:text-white"
                        >
                          <Shirt className="w-3 h-3 text-amber-300 shrink-0" />
                          What to Wear
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Sangeet */}
                  <AccordionItem value="sangeet" className="border-white/10">
                    <AccordionTrigger className="hover:no-underline hover:bg-white/5 px-2 py-2 rounded-lg text-sm text-white font-medium group">
                      <span className="flex items-center gap-3">
                        <Music className="w-4 h-4 text-purple-300 shrink-0" />
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <span>Sangeet</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] text-white font-serif tracking-[0.15em] uppercase font-normal whitespace-nowrap">
                            | Jan. 4th 2027 Mon
                          </span>
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pt-1 pb-3 text-xs text-white/80 leading-relaxed">
                      <p>An evening of music, dance performances, and celebration.</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <Link
                          href="/itinerary#sangeet"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase text-white/90 transition-colors hover:bg-white/20 hover:text-white"
                        >
                          <Clock className="w-3 h-3 text-purple-300 shrink-0" />
                          Itinerary
                        </Link>
                        <Link
                          href="/wardrobe-planner#sangeet"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase text-white/90 transition-colors hover:bg-white/20 hover:text-white"
                        >
                          <Shirt className="w-3 h-3 text-purple-300 shrink-0" />
                          What to Wear
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Lagna */}
                  <AccordionItem value="lagna" className="border-white/10">
                    <AccordionTrigger className="hover:no-underline hover:bg-white/5 px-2 py-2 rounded-lg text-sm text-white font-medium group">
                      <span className="flex items-center gap-3">
                        <Heart className="w-4 h-4 text-rose-300 shrink-0" />
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <span>Lagna</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] text-white font-serif tracking-[0.15em] uppercase font-normal whitespace-nowrap">
                            | Jan. 5th 2027 Tue
                          </span>
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pt-1 pb-3 text-xs text-white/80 leading-relaxed">
                      <p>The sacred wedding ceremony, tying the knot, and pheras.</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <Link
                          href="/itinerary#lagna"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase text-white/90 transition-colors hover:bg-white/20 hover:text-white"
                        >
                          <Clock className="w-3 h-3 text-rose-300 shrink-0" />
                          Itinerary
                        </Link>
                        <Link
                          href="/wardrobe-planner#lagna"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase text-white/90 transition-colors hover:bg-white/20 hover:text-white"
                        >
                          <Shirt className="w-3 h-3 text-rose-300 shrink-0" />
                          What to Wear
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </nav>

      {/* Floating Right Sidebar */}
      <div className="fixed right-4 sm:right-6 top-5 z-50 flex flex-col gap-6 p-2">
        <Link href="/our-story" className="group relative flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 transition-transform duration-300 hover:scale-110 active:scale-95">
          <div className="absolute inset-0 rounded-full bg-white/10 border border-white/20 scale-0 group-hover:scale-100 transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg" />
          <span className="absolute right-11 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none font-serif text-[10px] tracking-[0.2em] uppercase text-white bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg flex items-center">
            Our Story
          </span>
          <Heart className="w-5 h-5 z-10 text-white/80 group-hover:text-white transition-colors duration-300" />
        </Link>
        <Link href="/itinerary" className="group relative flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 transition-transform duration-300 hover:scale-110 active:scale-95">
          <div className="absolute inset-0 rounded-full bg-white/10 border border-white/20 scale-0 group-hover:scale-100 transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg" />
          <span className="absolute right-11 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none font-serif text-[10px] tracking-[0.2em] uppercase text-white bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg flex items-center">
            Itinerary
          </span>
          <Compass className="w-5 h-5 z-10 text-white/80 group-hover:text-white transition-colors duration-300" />
        </Link>
        <Link href="/wardrobe-planner" className="group relative flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 transition-transform duration-300 hover:scale-110 active:scale-95">
          <div className="absolute inset-0 rounded-full bg-white/10 border border-white/20 scale-0 group-hover:scale-100 transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg" />
          <span className="absolute right-11 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none font-serif text-[10px] tracking-[0.2em] uppercase text-white bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg flex items-center">
            Wardrobe Planner
          </span>
          <Shirt className="w-5 h-5 z-10 text-white/80 group-hover:text-white transition-colors duration-300" />
        </Link>
        <Link href="/guide" className="group relative flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 transition-transform duration-300 hover:scale-110 active:scale-95">
          <div className="absolute inset-0 rounded-full bg-white/10 border border-white/20 scale-0 group-hover:scale-100 transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg" />
          <span className="absolute right-11 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none font-serif text-[10px] tracking-[0.2em] uppercase text-white bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg flex items-center">
            Guide
          </span>
          <BookOpen className="w-5 h-5 z-10 text-white/80 group-hover:text-white transition-colors duration-300" />
        </Link>
        <Link href="/vadodara" className="group relative flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 transition-transform duration-300 hover:scale-110 active:scale-95">
          <div className="absolute inset-0 rounded-full bg-white/10 border border-white/20 scale-0 group-hover:scale-100 transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg" />
          <span className="absolute right-11 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none font-serif text-[10px] tracking-[0.2em] uppercase text-white bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg flex items-center">
            Vadodara
          </span>
          <MapPin className="w-5 h-5 z-10 text-white/80 group-hover:text-white transition-colors duration-300" />
        </Link>
        <Link href="#questions" className="group relative flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 transition-transform duration-300 hover:scale-110 active:scale-95">
          <div className="absolute inset-0 rounded-full bg-white/10 border border-white/20 scale-0 group-hover:scale-100 transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg" />
          <span className="absolute right-11 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none font-serif text-[10px] tracking-[0.25em] uppercase text-white bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg flex items-center">
            Questions
          </span>
          <CircleHelp className="w-5 h-5 z-10 text-white/80 group-hover:text-white transition-colors duration-300" />
        </Link>
      </div>
    </>
  )
}
