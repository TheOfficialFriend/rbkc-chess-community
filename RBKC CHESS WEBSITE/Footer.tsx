import { Crown, Mail, MapPin } from "lucide-react";
import { Link } from "wouter";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663428441773/CHgiAcrswzhYs7oY5fx6vF/logo_76bb0664.jpg";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={LOGO_URL}
                alt="RBKC Chess Community"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-secondary/40"
              />
              <div>
                <div className="font-serif font-bold text-lg text-secondary">RBKC Chess</div>
                <div className="text-xs text-primary-foreground/70">Community · Est. 2024</div>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Promoting chess education and creating inclusive spaces for players of all ages and skill levels across the Royal Borough of Kensington and Chelsea.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif font-semibold text-secondary mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/events", label: "Upcoming Events" },
                { href: "/matchmaker", label: "Find a Match" },
                { href: "/gallery", label: "Photo Gallery" },
                { href: "/membership", label: "Join the Club" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-primary-foreground/80 hover:text-secondary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Venues & Contact */}
          <div>
            <h3 className="font-serif font-semibold text-secondary mb-4">Our Venues</h3>
            <ul className="space-y-3 text-sm">
              {[
                { name: "Chelsea Library", address: "363 Kings Road, SW3 5ES" },
                { name: "Brompton Library", address: "Old Brompton Road, SW5 0DQ" },
                { name: "Earls Court Community Centre", address: "Earls Court Road, W8 6EJ" },
              ].map((venue) => (
                <li key={venue.name} className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-primary-foreground/90">{venue.name}</div>
                    <div className="text-primary-foreground/60 text-xs">{venue.address}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-2 text-sm text-primary-foreground/80">
              <Mail className="h-3.5 w-3.5 text-secondary" />
              <a
                href="mailto:OfficialfriendforLondon@proton.me"
                className="hover:text-secondary transition-colors"
              >
                OfficialfriendforLondon@proton.me
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-primary-foreground/60">
          <div className="flex items-center gap-2">
            <Crown className="h-3.5 w-3.5 text-secondary" />
            <span>Founded by Leonel Hapi, Chess Coach & Community Builder</span>
          </div>
          <div>© {new Date().getFullYear()} RBKC Chess Community. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
