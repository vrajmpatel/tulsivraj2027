"use client"

import Link from "next/link"
import { Book, Calendar, Flower2, Sun, Music, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-stone-900/20 to-transparent backdrop-blur-xs">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline"
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 pl-5 pr-2.5 py-2 font-serif text-xs tracking-[0.25em] uppercase text-white shadow-md backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 cursor-pointer h-10"
              >
                <Calendar className="w-4 h-4 text-gray-300 shrink-0" />
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
                    Traditional henna application, music, and dance celebration with family and friends.
                  </AccordionContent>
                </AccordionItem>

                {/* Vidhi & Haldi - Bride */}
                <AccordionItem value="haldi-bride" className="border-white/10">
                  <AccordionTrigger className="hover:no-underline hover:bg-white/5 px-2 py-2 rounded-lg text-sm text-white font-medium group">
                    <span className="flex items-center gap-3">
                      <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <span>Tulsi's Vidhi & Haldi</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] text-white font-serif tracking-[0.15em] uppercase font-normal whitespace-nowrap">
                          | Jan. 3rd 2027 Sun
                        </span>
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pt-1 pb-3 text-xs text-white/80 leading-relaxed">
                    Auspicious rituals and applying turmeric paste for purification and blessing.
                  </AccordionContent>
                </AccordionItem>

                {/* Vidhi & Haldi - Groom */}
                <AccordionItem value="haldi-groom" className="border-white/10">
                  <AccordionTrigger className="hover:no-underline hover:bg-white/5 px-2 py-2 rounded-lg text-sm text-white font-medium group">
                    <span className="flex items-center gap-3">
                      <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <span>Vraj's Vidhi & Haldi</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] text-white font-serif tracking-[0.15em] uppercase font-normal whitespace-nowrap">
                          | Jan. 4th 2027 Mon
                        </span>
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pt-1 pb-3 text-xs text-white/80 leading-relaxed">
                    Auspicious rituals and applying turmeric paste for purification and blessing.
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
                    An evening of music, dance performances, and celebration.
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
                    The sacred wedding ceremony, tying the knot, and pheras.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-4 md:gap-8">
            <Link href="#our-story" className="font-serif text-xs tracking-[0.25em] uppercase text-white/80 transition-colors hover:text-white">Our Story</Link>
            <Link href="#guide" className="font-serif text-xs tracking-[0.25em] uppercase text-white/80 transition-colors hover:text-white">Guide</Link>
            <Link href="#wardrobe-planner" className="font-serif text-xs tracking-[0.25em] uppercase text-white/80 transition-colors hover:text-white">Wardrobe Planner</Link>
            <Link href="#vadodara" className="font-serif text-xs tracking-[0.25em] uppercase text-white/80 transition-colors hover:text-white">Vadodara</Link>
            <Link href="#questions" className="font-serif text-xs tracking-[0.25em] uppercase text-white/80 transition-colors hover:text-white">Questions</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
