"use client"

import { useEffect, useState, type MouseEvent } from "react"
import {
  Sun,
  Plane,
  Globe,
  TrainFront,
  Car,
  Stamp,
  IndianRupee,
  Coins,
  Clock,
  Languages,
  CloudSun,
  Plug,
  Smartphone,
  HandHeart,
  Check,
  Building2,
  Phone,
  PlaneLanding,
  ReceiptIndianRupee,
  Bus,
  CarTaxiFront,
  Caravan,
  CarFront,
  TriangleAlert,
  Mountain,
  Landmark,
  Building,
  Droplet,
  Utensils,
  Flame,
  Pill,
  Siren,
  Shield,
  Ambulance,
  Sunset,
  ArrowUp,
  type LucideIcon,
} from "lucide-react"

// ----------------------------------------------------------------------------
// Content — sourced from the claude.ai/design handoff (project/Guide.html),
// itself built from the couple's Vadodara itinerary document.
// ----------------------------------------------------------------------------

const SECTIONS = [
  { id: "welcome", label: "Welcome" },
  { id: "essentials", label: "Before You Go" },
  { id: "stay", label: "Where to Stay" },
  { id: "around", label: "Getting Around" },
  { id: "explore", label: "Explore" },
  { id: "eat", label: "Where to Eat" },
  { id: "etiquette", label: "Customs" },
  { id: "contacts", label: "Contacts" },
] as const

type IconCard = { icon: LucideIcon; meta?: string; title: string; text: string }

const GETTING_THERE: IconCard[] = [
  { icon: Plane, meta: "By Air", title: "Vadodara Airport (BDQ)", text: "Domestic airport in Harni, ~6 km from the centre. Direct flights from Delhi, Mumbai, Hyderabad & Bengaluru." },
  { icon: Globe, meta: "From Abroad", title: "Via Mumbai or Ahmedabad", text: "Most international guests fly into Mumbai (BOM) or Ahmedabad (AMD), then connect by flight, train, or car." },
  { icon: TrainFront, meta: "By Train", title: "Vadodara Junction", text: "One of Gujarat's busiest stations. Mumbai ~5 hrs, Ahmedabad ~1.5 hrs, plus Delhi & beyond." },
  { icon: Car, meta: "By Road", title: "Well connected via NH 48", text: "Ahmedabad 1.5–2 hrs · Surat ~2.5 hrs · Mumbai 6–7 hrs by car." },
]

const AROUND_FROM: IconCard[] = [
  { icon: PlaneLanding, title: "From Vadodara Airport (BDQ)", text: "~6 km / 15–20 min to most hotels. Prepaid taxis, Ola and Uber available at the airport." },
  { icon: TrainFront, title: "From Vadodara Junction", text: "~5–7 km to Alkapuri hotels. Use the prepaid taxi counter or Ola/Uber." },
  { icon: ReceiptIndianRupee, title: "Estimated Cost", text: "About ₹200–400 by taxi to most hotels in the city." },
]

const AROUND_OWN: IconCard[] = [
  { icon: CarTaxiFront, title: "Ola & Uber", text: "Widely available and affordable. The easiest way to get around — download the apps first." },
  { icon: Caravan, title: "Auto-rickshaws", text: "Great for short distances. Agree on the fare or insist on the meter before starting." },
  { icon: CarFront, title: "Hired Car & Driver", text: "Best for day trips. Hotels can arrange one — expect ₹2,500–4,000 per day." },
  { icon: TriangleAlert, title: "Self-Drive Rentals", text: "Not recommended for first-time visitors — local traffic can be intense." },
]

const DAY_TRIPS: IconCard[] = [
  { icon: Mountain, title: "Statue of Unity (Kevadia)", text: "The world's tallest statue at 182 m, honouring Sardar Vallabhbhai Patel. ~90 km / 2 hrs — a full-day trip, so go early." },
  { icon: Landmark, title: "Champaner-Pavagadh", text: "A UNESCO World Heritage site of Hindu and Islamic monuments, ~50 km / 1.5 hrs. Combine with the Kalika Mata temple atop Pavagadh hill." },
  { icon: Building, title: "Ahmedabad", text: "Gujarat's largest city, ~1.5 hrs away — a UNESCO-listed old city, Sabarmati Ashram, and incredible street food." },
]

const FOOD_HEALTH: IconCard[] = [
  { icon: Droplet, title: "Drink bottled water", text: "Stick to bottled or filtered water, and avoid ice from unknown sources." },
  { icon: Utensils, title: "Eat where it's busy", text: "High-turnover, well-reviewed places mean fresher food." },
  { icon: Flame, title: "Ease into spice", text: 'New to Indian food? Ask for "medium" or "mild" to start.' },
  { icon: Pill, title: "Chemists everywhere", text: "Pharmacies are well-stocked; carry hand sanitiser and tissues." },
]

type Place = { n: string; title: string; desc: string; tag?: { icon: LucideIcon; text: string } }

const PLACES_HERITAGE: Place[] = [
  { n: "01", title: "Laxmi Vilas Palace", desc: "The Gaekwad royal residence — four times the size of Buckingham Palace and a stunning example of Indo-Saracenic architecture.", tag: { icon: Clock, text: "Allow 2 hours" } },
  { n: "02", title: "Maharaja Fateh Singh Museum", desc: "Inside the palace complex; the royal family's art collection, including European paintings and sculptures." },
  { n: "03", title: "Baroda Museum & Picture Gallery", desc: "Inside Sayaji Baug — archaeology, art, and natural-history collections from across the world." },
  { n: "04", title: "Kirti Mandir", desc: "The Gaekwad family memorial, with beautiful murals and a temple complex." },
  { n: "05", title: "Tambekar Wada", desc: "A 19th-century mansion with intricate Maratha-era wooden carvings and wall paintings." },
]

const PLACES_GARDENS: Place[] = [
  { n: "06", title: "Sayaji Baug (Kamati Baug)", desc: "The largest garden in Western India — home to a zoo, planetarium, and toy train. Lovely for an evening stroll." },
  { n: "07", title: "Sursagar Lake", desc: "A picturesque city-centre lake with a 120-foot Shiva statue rising from the water.", tag: { icon: Sunset, text: "Best at sunset" } },
  { n: "08", title: "Ajwa Nimeta Garden", desc: "An evening musical-fountain show, about 20 km from the city." },
]

const PLACES_MARKETS: Place[] = [
  { n: "09", title: "Khanderao Market", desc: "A bustling traditional market in the old city — great for spices, textiles, and local flavour." },
  { n: "10", title: "Mandvi Market", desc: "Best for Bandhani sarees (Gujarat's signature tie-dye), lac bangles, and silver jewellery." },
  { n: "11", title: "Teen Darwaza & Raopura", desc: "Old-city lanes, wonderful for silver jewellery and traditional handicrafts." },
  { n: "12", title: "Modern Malls", desc: "Inorbit, Centre Square & Seven Seas Mall — air-conditioned shopping and food courts." },
]

type EatCard = { title: string; meta: string; text: string }

const EAT_THALI: EatCard[] = [
  { title: "Mandap", meta: "Alkapuri", text: "Authentic Gujarati thali in a traditional setting. Try dhokla, undhiyu & puran poli." },
  { title: "Sasumaa Gujarati Thali", meta: "Race Course Rd · Trident Mall", text: "Famous for unlimited, home-style Gujarati thali." },
  { title: "Aamantran", meta: "Alkapuri", text: "A beloved local spot for home-style vegetarian Gujarati cooking." },
  { title: "Rajwadu", meta: "Sayajigunj", text: "Folk-themed setting with a traditional thali — great atmosphere for first-timers." },
]

const EAT_FINE: EatCard[] = [
  { title: "Peshawri", meta: "WelcomHotel ITC", text: "Outstanding tandoor and North-West Frontier cuisine. Worth the splurge." },
  { title: "Azure", meta: "Surya Palace Hotel", text: "Elegant multi-cuisine — great for a special evening." },
  { title: "Old School Eatery", meta: "Alkapuri, Vadodara", text: "A local favourite in Alkapuri." },
]

const EAT_CASUAL: EatCard[] = [
  { title: "Havmor", meta: "Multiple locations", text: "A Vadodara institution since 1944 — famous for ice cream and family-friendly food." },
  { title: "Brew 13 & CCD", meta: "Vadodara", text: "Reliable for coffee, sandwiches, and Wi-Fi." },
  { title: "Fiorella", meta: "Alkapuri", text: "Wood-fired pizzas and Italian, for a break from Indian food." },
  { title: "22nd Parallel", meta: "Vadodara", text: "Affordable South Indian — great dosas and idlis." },
]

const DISHES: { name: string; desc: string }[] = [
  { name: "Fafda-Jalebi", desc: "The iconic Gujarati breakfast — crispy chickpea snack with sweet, syrupy spirals." },
  { name: "Dhokla", desc: "Steamed savoury cake — light, fluffy and tangy." },
  { name: "Undhiyu", desc: "A winter specialty of mixed vegetables and dumplings (seasonal)." },
  { name: "Khaman", desc: "Fluffy, slightly sweet steamed chickpea snack." },
  { name: "Sev Usal", desc: "A spicy curry topped with crunchy sev — a Vadodara favourite." },
  { name: "Vada Pav & Dabeli", desc: "Beloved street snacks — try Rainbow Vada Pav or Shiv Shakti Dabeli." },
]

const PACK: string[] = [
  "Indian formal wear for events — sarees, lehengas, sherwanis, kurtas (see the Wardrobe Planner for each event)",
  "Comfortable, easy-to-slip-off shoes — you'll remove them at temples and many homes",
  "Light, breathable cotton clothing for daytime",
  "A light shawl or stole — for cool evenings and modesty at religious sites",
  "Sunscreen, sunglasses, and a hat for daytime sightseeing",
  "Modest clothing (shoulders & knees covered) for temple visits",
  "Prescription medications, plus antacids and oral rehydration salts",
  "Travel adapter (Type C/D/M) and a portable power bank",
]

const ETIQUETTE: string[] = [
  'Greet elders with "Namaste" (palms together) — a small bow shows respect.',
  "Remove your shoes before entering temples and most homes.",
  "Dress modestly at religious sites — shoulders and knees covered.",
  "Use your right hand for eating, giving, and receiving.",
  "Gujarat is a dry state — alcohol isn't sold, but tourists can apply for a liquor permit at the airport or larger hotels.",
  "Public displays of affection are uncommon — best saved for private.",
  "Bargaining is expected in markets, but not in shops with fixed prices.",
]

const PHRASES: { en: string; loc: string; em?: string }[] = [
  { en: "Hello / Greetings", loc: "Namaste", em: "· Kem cho (Guj.)" },
  { en: "Thank you", loc: "Aabhar", em: "· Dhanyavaad (Hin.)" },
  { en: "Yes / No", loc: "Haa / Naa" },
  { en: "Please", loc: "Kripa karine", em: "· Kripaya" },
  { en: "Excuse me / Sorry", loc: "Maaf karjo", em: "· Maaf kijiye" },
  { en: "How much?", loc: "Ketla rupiya?", em: "· Kitne rupaye?" },
  { en: "Water", loc: "Paani" },
  { en: "Delicious!", loc: "Swadisht!" },
]

const EMERGENCY: { icon: LucideIcon; label: string; num: string; tel: string }[] = [
  { icon: Siren, label: "All Services", num: "112", tel: "112" },
  { icon: Shield, label: "Police", num: "100", tel: "100" },
  { icon: Ambulance, label: "Ambulance", num: "108", tel: "108" },
  { icon: Flame, label: "Fire", num: "101", tel: "101" },
]

// ----------------------------------------------------------------------------
// Small presentational helpers
// ----------------------------------------------------------------------------

function Subhead({ children }: { children: React.ReactNode }) {
  return (
    <div className="subhead">
      <span className="l">{children}</span>
      <span className="rule" />
    </div>
  )
}

function IconCardGrid({ cards, cols }: { cards: IconCard[]; cols: "c3" | "c4" }) {
  return (
    <div className={`grid ${cols}`}>
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div className="card" key={c.title}>
            <div className="card-ico">
              <Icon size={21} strokeWidth={1.6} />
            </div>
            {c.meta && <p className="meta">{c.meta}</p>}
            <h4>{c.title}</h4>
            <p>{c.text}</p>
          </div>
        )
      })}
    </div>
  )
}

function EatGrid({ items, cols }: { items: EatCard[]; cols: "c3" | "c4" }) {
  return (
    <div className={`grid ${cols}`}>
      {items.map((c) => (
        <div className="card" key={c.title}>
          <h4>{c.title}</h4>
          <p className="meta">{c.meta}</p>
          <p>{c.text}</p>
        </div>
      ))}
    </div>
  )
}

function PlaceList({ places }: { places: Place[] }) {
  return (
    <div className="places">
      {places.map((p) => {
        const Tag = p.tag?.icon
        return (
          <div className="place" key={p.n}>
            <span className="idx">{p.n}</span>
            <div>
              <h4>{p.title}</h4>
              <p>{p.desc}</p>
              {p.tag && Tag && (
                <span className="tag">
                  <Tag size={14} strokeWidth={1.6} />
                  {p.tag.text}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export function TravelGuide() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const root = document.querySelector(".guide-root")
    if (!root) return

    // Scrollspy — highlight the sticky-nav link for the section in view.
    const sections = Array.from(root.querySelectorAll<HTMLElement>("section[id]"))
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId((e.target as HTMLElement).id)
        })
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    )
    sections.forEach((s) => spy.observe(s))

    // Reveal-on-scroll.
    const reveals = Array.from(root.querySelectorAll<HTMLElement>(".reveal"))
    const ro = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in")
            ro.unobserve(e.target)
          }
        })
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    )
    reveals.forEach((r) => ro.observe(r))

    const onScroll = () => setShowTop(window.scrollY > 700)
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()

    return () => {
      spy.disconnect()
      ro.disconnect()
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  const jumpTo = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="guide-root">
      {/* Hero */}
      <header className="hero">
        <div className="hero-img" aria-hidden="true" />
        <div className="wrap hero-inner">
          <p className="hero-kicker">~ Padharo Mhare Desh ~</p>
          <h1 className="hero-title">
            A Guest&apos;s Guide
            <br />
            to Vadodara
          </h1>
          <p className="hero-sub">
            Everything you need for the journey — travel logistics, where to stay, how to get
            around, and our favourite corners of the cultural capital of Gujarat.
          </p>
        </div>
      </header>

      {/* Sticky nav */}
      <nav className="subnav" id="subnav">
        <div className="wrap">
          <div className="subnav-row">
            <span className="subnav-brand">Travel Guide</span>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                className={"subnav-link" + (activeId === s.id ? " is-active" : "")}
                href={`#${s.id}`}
                onClick={(e) => jumpTo(e, s.id)}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Welcome */}
      <section id="welcome" className="sec">
        <div className="wrap">
          <div className="welcome reveal">
            <div>
              <span className="kicker">Welcome</span>
              <p className="lead" style={{ marginTop: 18 }}>
                Thank you for travelling to celebrate with us in Vadodara — also known as Baroda,
                the cultural capital of Gujarat.
              </p>
              <p>
                Once the royal seat of the Gaekwad dynasty, the city is a beautiful blend of Maratha
                heritage, Indo-Saracenic palaces, vibrant markets, and warm Gujarati hospitality.
              </p>
              <p>
                This guide gathers everything you'll need to make the most of your visit — and if a
                question comes up, our point person at the end of this guide is here to help.
              </p>
            </div>
            <figure className="welcome-fig" style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/indian_art.jpg"
                alt="An illustrated scene of royal Baroda — palaces, gardens, and a ceremonial elephant"
              />
              <figcaption className="welcome-cap">
                Vadodara — the royal city of the Gaekwads
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Before You Go */}
      <section id="essentials" className="sec alt">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Pre-Trip Essentials</span>
            <h2 className="sec-title">Before You Go</h2>
            <p className="sec-intro">
              January is peak season in Vadodara — the weather is at its most pleasant and perfect
              for outdoor ceremonies. Book flights and hotels early.
            </p>
          </div>

          {/* Travel dates */}
          <div className="block reveal">
            <Subhead>Travel Dates</Subhead>
            <div className="dates">
              <div className="date-card">
                <div className="tag">Recommended Arrival</div>
                <div className="big">Fri · Jan 1</div>
                <div className="small">Arrive a day early (or sooner) to settle in and beat the rush.</div>
              </div>
              <div className="date-card is-key">
                <div className="tag">Celebrations</div>
                <div className="big">Jan 2 – Jan 5</div>
                <div className="small">Four days of ceremonies, from the welcome dinner to the farewell brunch.</div>
              </div>
              <div className="date-card">
                <div className="tag">Recommended Departure</div>
                <div className="big">Wed · Jan 6</div>
                <div className="small">Depart on the 6th, or later if you'd like to extend the trip.</div>
              </div>
            </div>
            <p className="note-line">
              <Sun size={18} strokeWidth={1.6} />
              <span>
                Expect pleasant weather around <b>15–25°C (59–77°F)</b>. Peak tourist season across
                Gujarat — early booking is essential.
              </span>
            </p>
          </div>

          {/* Getting there */}
          <div className="block reveal">
            <Subhead>Getting to Vadodara</Subhead>
            <IconCardGrid cards={GETTING_THERE} cols="c4" />
          </div>

          {/* Visa callout */}
          <div className="block reveal">
            <div className="callout">
              <div className="callout-badge">
                <Stamp size={26} strokeWidth={1.6} />
              </div>
              <div>
                <h4>Visa &amp; Documents — International Guests</h4>
                <p className="ctxt">
                  Apply online at the official Government of India e-Visa portal,{" "}
                  <a href="https://indianvisaonline.gov.in/evisa" target="_blank" rel="noopener noreferrer">
                    indianvisaonline.gov.in/evisa
                  </a>
                  . Be cautious of look-alike third-party sites that charge extra fees.
                </p>
                <div className="visa-grid">
                  <div className="visa-item">
                    <span className="n">01</span>
                    <div>
                      <span>When to apply</span>
                      <p>At least 4 days before travel, and no earlier than 120 days before arrival.</p>
                    </div>
                  </div>
                  <div className="visa-item">
                    <span className="n">02</span>
                    <div>
                      <span>Tourist e-Visa options</span>
                      <p>30-day single entry, 1-year, or 5-year multiple-entry visas.</p>
                    </div>
                  </div>
                  <div className="visa-item">
                    <span className="n">03</span>
                    <div>
                      <span>What you'll need</span>
                      <p>A digital passport photo, a scan of your passport bio page, and a card for the fee.</p>
                    </div>
                  </div>
                  <div className="visa-item">
                    <span className="n">04</span>
                    <div>
                      <span>Passport &amp; arrival</span>
                      <p>6 months validity, 2 blank pages. Carry printed e-Visa, e-ticket &amp; hotel booking.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Good to know */}
          <div className="block reveal">
            <Subhead>Good to Know</Subhead>
            <div className="facts">
              <div className="fact">
                <div className="fact-top"><IndianRupee size={18} strokeWidth={1.6} /><span>Currency</span></div>
                <p>Indian Rupee (₹). ATMs everywhere; cards at hotels &amp; larger restaurants. <b>Carry cash</b> for markets &amp; tips.</p>
              </div>
              <div className="fact">
                <div className="fact-top"><Coins size={18} strokeWidth={1.6} /><span>Tipping</span></div>
                <p><b>10%</b> at restaurants if no service charge. ₹50–100 for porters &amp; drivers.</p>
              </div>
              <div className="fact">
                <div className="fact-top"><Clock size={18} strokeWidth={1.6} /><span>Time Zone</span></div>
                <p>India Standard Time, <b>UTC +5:30</b>. No daylight saving.</p>
              </div>
              <div className="fact">
                <div className="fact-top"><Languages size={18} strokeWidth={1.6} /><span>Language</span></div>
                <p>Gujarati &amp; Hindi widely spoken. English understood in hotels, restaurants &amp; tourist areas.</p>
              </div>
              <div className="fact">
                <div className="fact-top"><CloudSun size={18} strokeWidth={1.6} /><span>Weather</span></div>
                <p>Oct–Mar pleasant (15–30°C). Apr–Jun hot. Jul–Sep monsoon, warm &amp; humid.</p>
              </div>
              <div className="fact">
                <div className="fact-top"><Plug size={18} strokeWidth={1.6} /><span>Power</span></div>
                <p><b>230V, 50Hz.</b> Plug types C, D &amp; M. Bring a universal adapter.</p>
              </div>
              <div className="fact">
                <div className="fact-top"><Smartphone size={18} strokeWidth={1.6} /><span>SIM Cards</span></div>
                <p>Airtel &amp; Jio prepaid tourist SIMs at the airport. Bring a passport copy &amp; photo.</p>
              </div>
              <div className="fact">
                <div className="fact-top"><HandHeart size={18} strokeWidth={1.6} /><span>Hospitality</span></div>
                <p>Gujarat is warm &amp; welcoming. A smile and a "Kem cho?" go a long way.</p>
              </div>
            </div>
          </div>

          {/* What to pack */}
          <div className="block reveal">
            <Subhead>What to Pack</Subhead>
            <ul className="pack">
              {PACK.map((item) => (
                <li key={item}>
                  <span className="tick"><Check size={14} strokeWidth={2.2} /></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Where to Stay */}
      <section id="stay" className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Accommodations</span>
            <h2 className="sec-title">Where to Stay</h2>
          </div>

          <div className="block reveal">
            <div className="grid c2">
              <div className="card">
                <div className="card-ico"><Building2 size={21} strokeWidth={1.6} /></div>
                <h4>Suncity Club &amp; Resort</h4>
                <p className="addr">Next to Chandan Multiplex, Gotri-Sherkhi Road, Vadodara, Gujarat 391330</p>
                <a className="ph" href="tel:+918141414567"><Phone size={15} strokeWidth={1.6} />+91 81414 14567</a>
              </div>
              <div className="card">
                <div className="card-ico"><Building2 size={21} strokeWidth={1.6} /></div>
                <h4>Courtyard by Marriott Vadodara</h4>
                <p className="addr">Block B, Sarabhai Campus, Near Genda Circle, Alembic Road, Subhanpura, Vadodara, Gujarat 390023</p>
                <a className="ph" href="tel:+912656660000"><Phone size={15} strokeWidth={1.6} />+91 265 666 0000</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Around */}
      <section id="around" className="sec alt">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Local Transport</span>
            <h2 className="sec-title">Getting Around</h2>
            <p className="sec-intro">
              Vadodara is compact and easy to navigate. Ola and Uber are reliable and affordable —
              download the apps before you arrive.
            </p>
          </div>

          <div className="block reveal">
            <Subhead>From the Airport &amp; Station</Subhead>
            <IconCardGrid cards={AROUND_FROM} cols="c3" />
            <p className="note-line">
              <Bus size={18} strokeWidth={1.6} />
              <span>
                Shuttles between the hotel and wedding venues may be arranged — pickup times will be
                shared closer to the dates.
              </span>
            </p>
          </div>

          <div className="block reveal">
            <Subhead>Exploring on Your Own</Subhead>
            <IconCardGrid cards={AROUND_OWN} cols="c4" />
          </div>
        </div>
      </section>

      {/* Explore */}
      <section id="explore" className="sec">
        <div className="wrap">
          <div className="banner reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/indian_art.jpg" alt="Illustrated palaces and gardens of royal Baroda" />
            <div className="banner-txt">
              <span className="k">Things to Do</span>
              <h3>A few of our favourite corners of the city</h3>
            </div>
          </div>

          <div className="block reveal">
            <Subhead>Palaces &amp; Heritage</Subhead>
            <PlaceList places={PLACES_HERITAGE} />
          </div>

          <div className="block reveal">
            <Subhead>Gardens &amp; Lakes</Subhead>
            <PlaceList places={PLACES_GARDENS} />
          </div>

          <div className="block reveal">
            <Subhead>Markets &amp; Shopping</Subhead>
            <PlaceList places={PLACES_MARKETS} />
          </div>

          <div className="block reveal">
            <Subhead>Day Trips</Subhead>
            <IconCardGrid cards={DAY_TRIPS} cols="c3" />
          </div>
        </div>
      </section>

      {/* Where to Eat */}
      <section id="eat" className="sec alt">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Food &amp; Drink</span>
            <h2 className="sec-title">Where to Eat</h2>
            <p className="sec-intro">
              Vadodara and most of Gujarat are predominantly vegetarian, and the food is a highlight
              of any visit. A few places we love —
            </p>
          </div>

          <div className="block reveal">
            <Subhead>Gujarati Thali</Subhead>
            <EatGrid items={EAT_THALI} cols="c4" />
          </div>

          <div className="block reveal">
            <Subhead>North Indian &amp; Fine Dining</Subhead>
            <EatGrid items={EAT_FINE} cols="c3" />
          </div>

          <div className="block reveal">
            <Subhead>Casual &amp; Cafés</Subhead>
            <EatGrid items={EAT_CASUAL} cols="c4" />
          </div>

          <div className="block reveal">
            <Subhead>Must-Try Local Foods</Subhead>
            <div className="dishes">
              {DISHES.map((d) => (
                <div className="dish" key={d.name}>
                  <h5>{d.name}</h5>
                  <p>{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Customs & Etiquette */}
      <section id="etiquette" className="sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Helpful Extras</span>
            <h2 className="sec-title">Customs &amp; Good Sense</h2>
            <p className="sec-intro">
              A few small notes to help you feel at home — and a handful of phrases that will earn
              warm smiles.
            </p>
          </div>

          <div className="two-col reveal">
            <div>
              <Subhead>Local Customs &amp; Etiquette</Subhead>
              <ul className="etq">
                {ETIQUETTE.map((item) => (
                  <li key={item}>
                    <span className="b" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Subhead>Useful Phrases · Gujarati / Hindi</Subhead>
              <div className="phrases">
                {PHRASES.map((p) => (
                  <div className="phrase" key={p.en}>
                    <span className="en">{p.en}</span>
                    <span className="loc">
                      {p.loc} {p.em && <em>{p.em}</em>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="block reveal">
            <Subhead>Food &amp; Health Tips</Subhead>
            <IconCardGrid cards={FOOD_HEALTH} cols="c4" />
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section id="contacts" className="sec alt">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Key Contacts</span>
            <h2 className="sec-title">If You Need Anything</h2>
            <p className="sec-intro">
              For wedding-related questions, please reach out to our point person rather than the
              couple — we want them to enjoy every moment of the celebration.
            </p>
          </div>

          <div className="block reveal">
            <Subhead>Emergency Numbers</Subhead>
            <div className="emergency">
              {EMERGENCY.map((e) => {
                const Icon = e.icon
                return (
                  <a className="em" href={`tel:${e.tel}`} key={e.label}>
                    <span className="lab"><Icon size={16} strokeWidth={1.6} />{e.label}</span>
                    <span className="num">{e.num}</span>
                  </a>
                )
              })}
            </div>
          </div>

          <div className="contact-strip">
            <div className="pp">
              <span className="k">Point Person</span>
              <h4>Your first call</h4>
              <p>
                For anything wedding-related — logistics, timings, transport, or last-minute
                questions — our designated point person is here to help. Name and contact details
                will be shared here soon.
              </p>
              <span className="tba">Contact to be announced</span>
            </div>
            <div className="hosp">
              <span className="k">Health</span>
              <h4>Hospitals &amp; pharmacies</h4>
              <p>
                Well-equipped hospitals such as Sterling and Bhailal Amin General Hospital are in the
                city. 24-hour chemists are widely available. Specific details will be confirmed here.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="foot">
        <div className="foot-tex" aria-hidden="true" />
        <div className="wrap foot-inner">
          <div className="flo">❀ ❀ ❀</div>
          <h3>
            We can't wait to celebrate
            <br />
            with you in Vadodara
          </h3>
          <p>Safe travels, and thank you for making the journey. With love and aabhar —</p>
          <div className="sig">Tulsi &amp; Vraj</div>
        </div>
      </footer>

      <button
        className={"backtop" + (showTop ? " show" : "")}
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ArrowUp size={20} strokeWidth={1.6} />
      </button>
    </div>
  )
}
