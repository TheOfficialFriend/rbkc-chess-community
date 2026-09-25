import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Calendar, Crown, MapPin, Trophy, Users } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663428441773/CHgiAcrswzhYs7oY5fx6vF/logo_76bb0664.jpg";
const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663428441773/CHgiAcrswzhYs7oY5fx6vF/chess6_0d6e0217.jpg";

const PARTNERS = [
  {
    name: "Earls Court Community Hub",
    address: "Earls Court Road, SW5 9QJ",
    day: "Regular weekly sessions & programming",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663428441773/CHgiAcrswzhYs7oY5fx6vF/chess3_781b7bb6.jpeg",
  },
];

const STATS = [
  { icon: Users, label: "Active Members", value: "150+" },
  { icon: Trophy, label: "Matches Played", value: "500+" },
  { icon: MapPin, label: "Primary Hub", value: "1" },
  { icon: Calendar, label: "Events This Year", value: "50+" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: events } = trpc.events.upcoming.useQuery();
  const { data: gallery } = trpc.gallery.list.useQuery({ featuredOnly: true });

  const upcomingEvents = events?.slice(0, 3) ?? [];
  const featuredPhotos = gallery?.slice(0, 4) ?? [];

  return (
    <div className="flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Chess community" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
        </div>

        {/* Chess pattern overlay */}
        <div className="absolute inset-0 chess-pattern opacity-10" />

        <div className="relative container py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <img
                src={LOGO_URL}
                alt="RBKC Chess Community"
                className="h-16 w-16 rounded-full object-cover ring-4 ring-secondary/60 shadow-xl"
              />
              <Badge className="bg-secondary text-secondary-foreground font-semibold px-3 py-1">
                Est. 2024 · RBKC
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-6">
              Chess for
              <span className="block text-secondary">Everyone</span>
              in Kensington & Chelsea
            </h1>

            <p className="text-lg text-white/85 leading-relaxed mb-8 max-w-xl">
              Join London's most inclusive chess community at our primary home at the Earls Court Community Hub. Attend club sessions, play over the board, and be part of a growing movement across RBKC.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/matchmaker">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold shadow-lg">
                  Find a Match
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              {!isAuthenticated ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary bg-transparent font-semibold"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Join the Community
                </Button>
              ) : (
                <Link href="/events">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-primary bg-transparent font-semibold"
                  >
                    View Events
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="bg-primary py-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <Icon className="h-6 w-6 text-secondary mx-auto mb-2" />
                <div className="text-3xl font-serif font-bold text-white">{value}</div>
                <div className="text-sm text-primary-foreground/70 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/30 mb-4">
                About Us
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primary mb-6">
                Chess Without Boundaries
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                RBKC Chess Community is an officially consolidated chess club established in 2024, operating primarily out of the Earls Court Community Hub to bring chess directly to the heart of the community.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our mission is to promote chess education and create inclusive spaces where people of all ages and skill levels can enjoy the game. From complete beginners to experienced players, everyone is welcome at the board.
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={LOGO_URL}
                  alt="Leonel Mbaho"
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
                />
                <div>
                  <div className="font-semibold text-primary">Leonel Mbaho</div>
                  <div className="text-sm text-muted-foreground">Chess Coach & Founder</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663428441773/CHgiAcrswzhYs7oY5fx6vF/chess1_4a9e3715.jpg"
                alt="Chess session"
                className="rounded-xl object-cover w-full h-48 shadow-md"
              />
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663428441773/CHgiAcrswzhYs7oY5fx6vF/chess5_07055cce.jpg"
                alt="Family chess"
                className="rounded-xl object-cover w-full h-48 shadow-md mt-6"
              />
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663428441773/CHgiAcrswzhYs7oY5fx6vF/chess8_5eb13e35.jpg"
                alt="Hub chess"
                className="rounded-xl object-cover w-full h-48 shadow-md -mt-6"
              />
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663428441773/CHgiAcrswzhYs7oY5fx6vF/chess4_e947f88b.jpg"
                alt="Community chess"
                className="rounded-xl object-cover w-full h-48 shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Partner Venue / Hub ───────────────────────────────────────────── */}
      <section className="py-20 bg-muted/50 chess-pattern">
        <div className="container">
          <div className="text-center mb-12">
            <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/30 mb-4">
              Our Venue
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primary">
              Earls Court Community Hub
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Our primary operational home hosting weekly chess sessions and community programming.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {PARTNERS.map((partner) => (
              <Card key={partner.name} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={partner.img}
                    alt={partner.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-serif font-bold text-white text-lg leading-tight">{partner.name}</h3>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-3.5 w-3.5 text-secondary mt-0.5 shrink-0" />
                    {partner.address}
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-secondary mt-0.5 shrink-0" />
                    {partner.day}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upcoming Events ──────────────────────────────────────────────── */}
      {upcomingEvents.length > 0 && (
        <section className="py-20 bg-background">
          <div className="container">
            <div className="flex items-center justify-between mb-10">
              <div>
                <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/30 mb-3">
                  Calendar
                </Badge>
                <h2 className="text-3xl font-serif font-bold text-primary">Upcoming Events</h2>
              </div>
              <Link href="/events">
                <Button variant="outline" className="hidden sm:flex items-center gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow border-l-4 border-l-secondary">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge
                        variant="outline"
                        className="text-xs border-primary/30 text-primary"
                      >
                        {event.venue}
                      </Badge>
                      {Number(event.entryFee) > 0 && (
                        <Badge className="bg-secondary text-secondary-foreground text-xs">
                          £{Number(event.entryFee).toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-serif font-semibold text-primary mb-2">{event.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-secondary" />
                      {format(new Date(event.startTime), "EEE d MMM, h:mm a")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 text-center sm:hidden">
              <Link href="/events">
                <Button variant="outline">View All Events</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Gallery Preview ──────────────────────────────────────────────── */}
      {featuredPhotos.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="flex items-center justify-between mb-10">
              <div>
                <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/30 mb-3">
                  Gallery
                </Badge>
                <h2 className="text-3xl font-serif font-bold text-primary">Community in Action</h2>
              </div>
              <Link href="/gallery">
                <Button variant="outline" className="hidden sm:flex items-center gap-2">
                  View Gallery
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredPhotos.map((photo) => (
                <div key={photo.id} className="relative group overflow-hidden rounded-xl aspect-square">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title ?? "Chess session"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white text-xs font-medium line-clamp-2">{photo.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 navy-gradient">
        <div className="container text-center">
          <Crown className="h-12 w-12 text-secondary mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
            Ready to Play?
          </h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8 text-lg">
            Join the RBKC Chess Community today. Find opponents, attend events at the Earls Court Community Hub, and be part of London's most welcoming chess family.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/matchmaker">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
                Find a Match Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/events">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary bg-transparent font-semibold">
                View Upcoming Events
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}