import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Users, CheckCircle2, PoundSterling } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const VENUE_COLORS: Record<string, string> = {
  "Chelsea Library": "bg-blue-100 text-blue-800 border-blue-200",
  "Brompton Library": "bg-green-100 text-green-800 border-green-200",
  "Earls Court Community Centre": "bg-purple-100 text-purple-800 border-purple-200",
};

export default function Events() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: events, isLoading } = trpc.events.upcoming.useQuery();
  const [rsvpingId, setRsvpingId] = useState<number | null>(null);

  const rsvpMutation = trpc.events.rsvp.useMutation({
    onSuccess: () => {
      utils.events.upcoming.invalidate();
      toast.success("RSVP confirmed!");
    },
    onError: () => toast.error("Failed to RSVP. Please try again."),
    onSettled: () => setRsvpingId(null),
  });

  const handleRsvp = (eventId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setRsvpingId(eventId);
    rsvpMutation.mutate({ eventId, status: "going" });
  };

  // Group events by month
  const grouped = (events ?? []).reduce<Record<string, typeof events>>((acc, event) => {
    const month = format(new Date(event.startTime), "MMMM yyyy");
    if (!acc[month]) acc[month] = [];
    acc[month]!.push(event);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="navy-gradient py-16">
        <div className="container text-center">
          <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-4">
            Calendar
          </Badge>
          <h1 className="text-4xl font-serif font-bold text-white mb-3">Upcoming Events</h1>
          <p className="text-white/80 max-w-lg mx-auto">
            Chess club sessions, tournaments, and workshops across our partner venues in RBKC.
          </p>
        </div>
      </div>

      <div className="container py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No upcoming events scheduled.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([month, monthEvents]) => (
              <div key={month}>
                <h2 className="text-2xl font-serif font-bold text-primary mb-6 flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-secondary" />
                  {month}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {monthEvents?.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onRsvp={() => handleRsvp(event.id)}
                      isRsvping={rsvpingId === event.id}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  onRsvp,
  isRsvping,
  isAuthenticated,
}: {
  event: any;
  onRsvp: () => void;
  isRsvping: boolean;
  isAuthenticated: boolean;
}) {
  const { data: rsvpCount } = trpc.events.rsvpCount.useQuery({ eventId: event.id });
  const { data: myRsvp } = trpc.events.myRsvp.useQuery(
    { eventId: event.id },
    { enabled: isAuthenticated }
  );

  const venueColor = VENUE_COLORS[event.venue] ?? "bg-gray-100 text-gray-800 border-gray-200";
  const isFull = event.maxAttendees && (rsvpCount ?? 0) >= event.maxAttendees;
  const hasRsvped = myRsvp?.status === "going";

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden border-t-4 border-t-secondary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="outline" className={`text-xs ${venueColor}`}>
            {event.venue}
          </Badge>
          {Number(event.entryFee) > 0 ? (
            <Badge className="bg-secondary text-secondary-foreground text-xs flex items-center gap-1">
              <PoundSterling className="h-3 w-3" />
              {Number(event.entryFee).toFixed(2)}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
              Free
            </Badge>
          )}
        </div>
        <CardTitle className="font-serif text-primary text-lg leading-tight">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-secondary shrink-0" />
            {format(new Date(event.startTime), "EEEE, d MMMM yyyy")}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-secondary shrink-0" />
            {format(new Date(event.startTime), "h:mm a")}
            {event.endTime && ` – ${format(new Date(event.endTime), "h:mm a")}`}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-secondary shrink-0" />
            {event.venueAddress ?? event.venue}
          </div>
          {event.maxAttendees && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-secondary shrink-0" />
              {rsvpCount ?? 0} / {event.maxAttendees} attending
            </div>
          )}
        </div>

        <div className="pt-2">
          {hasRsvped ? (
            <Button className="w-full" variant="outline" disabled>
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
              You're Going!
            </Button>
          ) : isFull ? (
            <Button className="w-full" variant="outline" disabled>
              Event Full
            </Button>
          ) : (
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onRsvp}
              disabled={isRsvping}
            >
              {isRsvping ? "Confirming..." : isAuthenticated ? "RSVP Now" : "Sign In to RSVP"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
