import { Heart, Music, Building2, Plane, TrainFront, ArrowUpRight, type LucideIcon } from "lucide-react"

// Key addresses, shared with the Itinerary (VENUE / SANGEET_VENUE) and Guide
// (hotels) pages — repeated here since each page keeps its own content.
type Place = { tag: string; name: string; address: string; icon: LucideIcon; mapsUrl: string }

const googleMapsSearch = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

const PLACES: Place[] = [
  {
    tag: "Wedding Venue",
    name: "Aambaug, Vadodara",
    address: "834R+XR8, Ampad, Vadodara, Gujarat 391101, India",
    icon: Heart,
    mapsUrl: "https://maps.app.goo.gl/fQaPZkFKYjZtpaLAA",
  },
  {
    tag: "Sangeet Venue",
    name: "Suncity Club & Resort",
    address: "Next to Chandan Multiplex, Gotri-Sherkhi Road, Vadodara, Gujarat 391330, India",
    icon: Music,
    mapsUrl: "https://maps.app.goo.gl/8j15FuUyTndy8Err7",
  },
  {
    tag: "Hotel",
    name: "Courtyard by Marriott Vadodara",
    address: "Block B, Sarabhai Campus, Near Genda Circle, Alembic Road, Subhanpura, Vadodara, Gujarat 390023",
    icon: Building2,
    mapsUrl: googleMapsSearch("Courtyard by Marriott Vadodara, Alembic Road, Subhanpura, Vadodara, Gujarat 390023"),
  },
  {
    tag: "Airport",
    name: "Vadodara Airport (BDQ)",
    address: "Harni, Vadodara, Gujarat 390022, India",
    icon: Plane,
    mapsUrl: googleMapsSearch("Vadodara Airport BDQ, Harni, Vadodara, Gujarat"),
  },
  {
    tag: "Railway",
    name: "Vadodara Junction",
    address: "Sayajigunj, Vadodara, Gujarat 390020, India",
    icon: TrainFront,
    mapsUrl: googleMapsSearch("Vadodara Junction Railway Station, Vadodara, Gujarat"),
  },
]

export function VadodaraMap() {
  return (
    <div className="vad-root">
      <header className="vad-hero">
        <div className="vad-hero-img" aria-hidden="true" />
        <div className="wrap vad-hero-inner">
          <p className="vad-hero-kicker">~ The City ~</p>
          <h1 className="vad-hero-title">Vadodara</h1>
          <p className="vad-hero-sub">
            The wedding venue, our recommended hotels, and the airport and station — all on one
            map, so you always know where you&apos;re headed.
          </p>
        </div>
      </header>

      <section className="vad-sec">
        <div className="wrap">
          <div className="vad-sec-head">
            <span className="vad-kicker">Map</span>
            <h2 className="vad-sec-title">Find Your Way Around</h2>
            <p className="vad-sec-intro">
              Centred on Aambaug, the wedding venue. Zoom out to see the rest of the city.
            </p>
          </div>
          <div className="vad-map-frame">
            <iframe
              title="Map of Vadodara, Gujarat"
              src="https://www.google.com/maps?q=Aambaug,+Ampad,+Vadodara,+Gujarat+391101&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <section className="vad-sec alt">
        <div className="wrap">
          <div className="vad-sec-head">
            <span className="vad-kicker">Key Places</span>
            <h2 className="vad-sec-title">Venues, Stays &amp; Transit</h2>
          </div>
          <div className="vad-grid">
            {PLACES.map((p) => (
              <a key={p.name} href={p.mapsUrl} target="_blank" rel="noopener noreferrer" className="vad-card">
                <div className="vad-card-ico">
                  <p.icon size={20} strokeWidth={1.6} />
                </div>
                <div className="vad-card-tag">{p.tag}</div>
                <h4>{p.name}</h4>
                <p>{p.address}</p>
                <span className="vad-card-link">
                  Open in Maps
                  <ArrowUpRight size={13} strokeWidth={2} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
