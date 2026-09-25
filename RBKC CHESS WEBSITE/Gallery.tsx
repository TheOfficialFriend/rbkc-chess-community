import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { MapPin, X } from "lucide-react";
import { useState } from "react";

const VENUE_FILTERS = ["All", "Chelsea Library", "Brompton Library", "Earls Court Community Centre"];

export default function Gallery() {
  const { data: photos, isLoading } = trpc.gallery.list.useQuery({ featuredOnly: false });
  const [filter, setFilter] = useState("All");
  type Photo = NonNullable<typeof photos>[number];
  const [selected, setSelected] = useState<Photo | null>(null);

  const filtered = (photos ?? []).filter(
    (p) => filter === "All" || p.venue === filter
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="navy-gradient py-16">
        <div className="container text-center">
          <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-4">
            Gallery
          </Badge>
          <h1 className="text-4xl font-serif font-bold text-white mb-3">Community in Action</h1>
          <p className="text-white/80 max-w-lg mx-auto">
            Moments from our chess sessions across RBKC venues — a community united by the love of the game.
          </p>
        </div>
      </div>

      <div className="container py-12">
        {/* Venue filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {VENUE_FILTERS.map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filter === v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((photo) => (
              <div
                key={photo.id}
                className="relative group overflow-hidden rounded-xl cursor-pointer"
                onClick={() => setSelected(photo)}
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.title ?? "Chess session"}
                  className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-xs font-semibold line-clamp-2">{photo.title}</p>
                    {photo.venue && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-secondary" />
                        <span className="text-white/80 text-xs">{photo.venue}</span>
                      </div>
                    )}
                  </div>
                </div>
                {photo.featured && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-secondary text-secondary-foreground text-xs px-1.5 py-0.5">
                      Featured
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-secondary transition-colors"
            onClick={() => setSelected(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <div
            className="max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selected.imageUrl}
              alt={selected.title ?? "Chess session"}
              className="w-full max-h-[75vh] object-contain rounded-lg"
            />
            {(selected.title || selected.venue) && (
              <div className="mt-4 text-center">
                {selected.title && (
                  <h3 className="text-white font-serif font-semibold text-lg">{selected.title}</h3>
                )}
                {selected.description && (
                  <p className="text-white/70 text-sm mt-1">{selected.description}</p>
                )}
                {selected.venue && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <MapPin className="h-3.5 w-3.5 text-secondary" />
                    <span className="text-white/60 text-sm">{selected.venue}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
