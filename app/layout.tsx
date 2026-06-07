import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Oranienbaum, Inter } from "next/font/google"
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

export const metadata: Metadata = {
  title: "Tulsi & Vraj's Wedding 2027 - Vadodara",
  description: "Deploy intelligent AI support agents that solve your customers' problems with seamless integrations and enterprise security",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${oranienbaum.variable} ${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
