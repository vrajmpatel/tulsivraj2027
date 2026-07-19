import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Oranienbaum, Inter, Poiret_One, WindSong } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

const oranienbaum = Oranienbaum({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-oranienbaum",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const poiretOne = Poiret_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-poiret",
  display: "swap",
})

const windSong = WindSong({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-windsong",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Tulsi & Vraj's Wedding 2027 - Vadodara",
  description: "Deploy intelligent AI support agents that solve your customers' problems with seamless integrations and enterprise security",
  icons: {
    icon: [
      { url: "/favicon_io/favicon.ico", sizes: "any" },
      { url: "/favicon_io/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon_io/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: "/favicon_io/apple-touch-icon.png",
  },
  manifest: "/favicon_io/site.webmanifest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${oranienbaum.variable} ${inter.variable} ${poiretOne.variable} ${windSong.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
