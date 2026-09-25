import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Crown,
  Filter,
  MapPin,
  PoundSterling,
  RefreshCw,
  Swords,
  Trophy,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const SKILL_COLORS: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#3b82f6",
  advanced: "#f59e0b",
  expert: "#ef4444",
};

const SKILL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

// Default London centre (RBKC area)
const LONDON_CENTER = { lat: 51.4921, lng: -0.1938 };

export default function MatchMaker() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: allPlayers, isLoading, refetch } = trpc.players.all.useQuery();
  const { data: myProfile } = trpc.players.me.useQuery(undefined, { enabled: isAuthenticated });

  const setPresenceMutation = trpc.players.setPresence.useMutation({
    onSuccess: () => utils.players.all.invalidate(),
  });

  const requestMatchMutation = trpc.matches.request.useMutation({
    onSuccess: () => {
      toast.success("Match request sent!");
      setMatchDialog(null);
      utils.matches.myMatches.invalidate();
    },
    onError: () => toast.error("Failed to send match request."),
  });

  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  type PlayerType = NonNullable<typeof allPlayers>[number];
  const [matchDialog, setMatchDialog] = useState<PlayerType | null>(null);
  const [matchForm, setMatchForm] = useState({ venue: "", message: "", stakeAmount: "" });
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Filter players
  const filteredPlayers = (allPlayers ?? []).filter((p) => {
    if (skillFilter !== "all" && p.skillLevel !== skillFilter) return false;
    if (availableOnly && !p.isAvailable) return false;
    return true;
  });

  const onlinePlayers = (allPlayers ?? []).filter((p) => p.isOnline);

  // Toggle own presence
  const handleTogglePresence = (available: boolean) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setPresenceMutation.mutate({ isOnline: true, isAvailable: available });
    toast.success(available ? "You're now available for matches!" : "Availability turned off");
  };

  // Place markers on map
  useEffect(() => {
    if (!mapRef) return;

    // Clear existing markers
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    if (infoWindowRef.current) infoWindowRef.current.close();

    filteredPlayers.forEach((player) => {
      if (!player.locationLat || !player.locationLng) return;

      const lat = Number(player.locationLat);
      const lng = Number(player.locationLng);
      if (isNaN(lat) || isNaN(lng)) return;

      const color = SKILL_COLORS[player.skillLevel ?? "beginner"] ?? "#3b82f6";
      const isOnline = player.isOnline;
      const isAvail = player.isAvailable;

      // Create pin element
      const pin = document.createElement("div");
      pin.style.cssText = `
        width: 36px; height: 36px; border-radius: 50%;
        background: ${color}; border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; position: relative;
        font-size: 16px;
      `;
      pin.innerHTML = "♟";
      pin.style.color = "white";

      if (isOnline) {
        const dot = document.createElement("div");
        dot.style.cssText = `
          position: absolute; top: -2px; right: -2px;
          width: 10px; height: 10px; border-radius: 50%;
          background: ${isAvail ? "#22c55e" : "#f59e0b"};
          border: 2px solid white;
        `;
        pin.appendChild(dot);
      }

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat, lng },
        map: mapRef,
        content: pin,
        title: player.displayName ?? player.userName ?? "Player",
      });

      marker.addListener("click", () => {
        if (!infoWindowRef.current) {
          infoWindowRef.current = new google.maps.InfoWindow();
        }
        const displayName = player.displayName ?? player.userName ?? "Player";
        const rating = player.chessRating ?? 1200;
        const skill = SKILL_LABELS[player.skillLevel ?? "beginner"] ?? "Beginner";
        const statusText = player.isOnline
          ? player.isAvailable
            ? '<span style="color:#22c55e">● Available</span>'
            : '<span style="color:#f59e0b">● Online</span>'
          : '<span style="color:#9ca3af">● Offline</span>';

        infoWindowRef.current.setContent(`
          <div style="font-family:Inter,sans-serif;padding:4px;min-width:160px">
            <div style="font-weight:700;font-size:14px;color:#1e3a5f;margin-bottom:4px">${displayName}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:2px">Rating: <strong>${rating}</strong></div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:4px">Level: ${skill}</div>
            <div style="font-size:12px;margin-bottom:6px">${statusText}</div>
            ${player.locationName ? `<div style="font-size:11px;color:#9ca3af">📍 ${player.locationName}</div>` : ""}
          </div>
        `);
        infoWindowRef.current.open(mapRef, marker);
      });

      markersRef.current.push(marker);
    });

    // Add venue markers
    const venues = [
      { name: "Chelsea Library", lat: 51.4875, lng: -0.1687 },
      { name: "Brompton Library", lat: 51.4909, lng: -0.1862 },
      { name: "Earls Court Community Centre", lat: 51.4921, lng: -0.1938 },
    ];

    venues.forEach((venue) => {
      const pin = document.createElement("div");
      pin.style.cssText = `
        background: #1e3a5f; color: white; border-radius: 8px;
        padding: 4px 8px; font-size: 11px; font-weight: 600;
        border: 2px solid #c9a84c; white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3); cursor: default;
      `;
      pin.innerHTML = `♛ ${venue.name}`;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: venue.lat, lng: venue.lng },
        map: mapRef,
        content: pin,
        title: venue.name,
      });

      markersRef.current.push(marker);
    });
  }, [mapRef, filteredPlayers]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => refetch(), 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const handleSendMatchRequest = () => {
    if (!matchDialog) return;
    requestMatchMutation.mutate({
      challengedUserId: matchDialog.userId,
      venue: matchForm.venue || undefined,
      message: matchForm.message || undefined,
      stakeAmount: matchForm.stakeAmount ? Number(matchForm.stakeAmount) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="navy-gradient py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-3">
                Live Map
              </Badge>
              <h1 className="text-3xl font-serif font-bold text-white">Chess Match Maker</h1>
              <p className="text-white/80 mt-1 text-sm">
                Find available players near you in London. Challenge them to a game — with or without stakes.
              </p>
            </div>

            {/* Presence toggle */}
            <Card className="bg-white/10 border-white/20 text-white min-w-64">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">My Availability</span>
                  {myProfile?.isOnline ? (
                    <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                      <Wifi className="h-3 w-3 mr-1" />
                      Online
                    </Badge>
                  ) : (
                    <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">
                      <WifiOff className="h-3 w-3 mr-1" />
                      Offline
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={myProfile?.isAvailable ?? false}
                    onCheckedChange={handleTogglePresence}
                    disabled={!isAuthenticated || setPresenceMutation.isPending}
                  />
                  <span className="text-sm text-white/80">
                    {myProfile?.isAvailable ? "Available for matches" : "Not available"}
                  </span>
                </div>
                {!isAuthenticated && (
                  <p className="text-xs text-white/60 mt-2">
                    <button
                      className="underline hover:text-secondary"
                      onClick={() => (window.location.href = getLoginUrl())}
                    >
                      Sign in
                    </button>{" "}
                    to set your availability
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4 text-secondary" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Skill Level</Label>
                  <Select value={skillFilter} onValueChange={setSkillFilter}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="available-only"
                    checked={availableOnly}
                    onCheckedChange={setAvailableOnly}
                  />
                  <Label htmlFor="available-only" className="text-sm cursor-pointer">
                    Available only
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Refresh
                </Button>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Map Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(SKILL_COLORS).map(([skill, color]) => (
                  <div key={skill} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ background: color }}
                    />
                    <span className="capitalize text-muted-foreground">{skill}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    Available
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Online (busy)
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Online players count */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-serif font-bold text-secondary">{onlinePlayers.length}</div>
                <div className="text-xs text-primary-foreground/80 mt-1">Players Online Now</div>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-xl overflow-hidden border border-border shadow-md" style={{ height: "500px" }}>
              <MapView
                onMapReady={(map) => {
                  map.setCenter(LONDON_CENTER);
                  map.setZoom(13);
                  setMapRef(map);
                }}
              />
            </div>

            {/* Player list */}
            <div>
              <h3 className="font-serif font-semibold text-primary mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-secondary" />
                Players ({filteredPlayers.length})
              </h3>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No players match your filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredPlayers.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      isMe={isAuthenticated && player.userId === (user as any)?.id}
                      onChallenge={() => setMatchDialog(player)}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Match Request Dialog */}
      <Dialog open={!!matchDialog} onOpenChange={(open) => !open && setMatchDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Swords className="h-5 w-5 text-secondary" />
              Challenge{" "}
              {matchDialog?.displayName ?? matchDialog?.userName ?? "Player"}
            </DialogTitle>
            <DialogDescription>
              Send a match request. You can optionally propose a venue and add a monetary stake.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="venue" className="text-sm font-medium">
                Proposed Venue (optional)
              </Label>
              <Input
                id="venue"
                placeholder="e.g. Chelsea Library, Kings Road"
                value={matchForm.venue}
                onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="message" className="text-sm font-medium">
                Message (optional)
              </Label>
              <Textarea
                id="message"
                placeholder="Add a note to your challenge..."
                value={matchForm.message}
                onChange={(e) => setMatchForm({ ...matchForm, message: e.target.value })}
                className="mt-1.5 resize-none"
                rows={3}
              />
            </div>

            <div className="border border-secondary/30 rounded-lg p-4 bg-secondary/5">
              <div className="flex items-center gap-2 mb-3">
                <PoundSterling className="h-4 w-4 text-secondary" />
                <Label className="text-sm font-semibold text-primary">Money Match Stake</Label>
                <Badge variant="outline" className="text-xs ml-auto">Optional</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Propose a monetary stake. Both players must fund their share before the match begins. Winner takes the pot (5% platform fee applies).
              </p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">£</span>
                <Input
                  type="number"
                  min="1"
                  max="500"
                  placeholder="0.00"
                  value={matchForm.stakeAmount}
                  onChange={(e) => setMatchForm({ ...matchForm, stakeAmount: e.target.value })}
                  className="flex-1"
                />
              </div>
              {matchForm.stakeAmount && Number(matchForm.stakeAmount) > 0 && (
                <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                  <div>Total pot: <strong>£{(Number(matchForm.stakeAmount) * 2).toFixed(2)}</strong></div>
                  <div>Platform fee (5%): <strong>£{(Number(matchForm.stakeAmount) * 0.1).toFixed(2)}</strong></div>
                  <div>Winner receives: <strong>£{(Number(matchForm.stakeAmount) * 2 * 0.95).toFixed(2)}</strong></div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMatchDialog(null)}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={handleSendMatchRequest}
              disabled={requestMatchMutation.isPending}
            >
              <Swords className="h-4 w-4 mr-2" />
              {requestMatchMutation.isPending ? "Sending..." : "Send Challenge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlayerCard({
  player,
  isMe,
  onChallenge,
  isAuthenticated,
}: {
  player: any;
  isMe: boolean;
  onChallenge: () => void;
  isAuthenticated: boolean;
}) {
  const displayName = player.displayName ?? player.userName ?? "Anonymous Player";
  const skillColor = SKILL_COLORS[player.skillLevel ?? "beginner"] ?? "#3b82f6";

  return (
    <Card className={`hover:shadow-md transition-shadow ${isMe ? "ring-2 ring-secondary" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: skillColor }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-primary text-sm truncate">
                {displayName}
                {isMe && (
                  <Badge className="ml-1.5 text-xs bg-secondary text-secondary-foreground">You</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Trophy className="h-3 w-3 text-secondary" />
                <span className="text-xs text-muted-foreground">{player.chessRating ?? 1200}</span>
                <span
                  className="text-xs capitalize px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: skillColor }}
                >
                  {player.skillLevel ?? "beginner"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  player.isOnline
                    ? player.isAvailable
                      ? "bg-green-500 online-pulse"
                      : "bg-amber-500"
                    : "bg-gray-300"
                }`}
              />
              <span className="text-xs text-muted-foreground">
                {player.isOnline ? (player.isAvailable ? "Available" : "Online") : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {player.locationName && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 text-secondary" />
            {player.locationName}
          </div>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="text-green-600 font-medium">{player.wins ?? 0}W</span>
          <span className="text-red-500 font-medium">{player.losses ?? 0}L</span>
          <span className="text-gray-500">{player.draws ?? 0}D</span>
        </div>

        {!isMe && (
          <Button
            size="sm"
            className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8"
            onClick={onChallenge}
            disabled={!isAuthenticated}
          >
            <Swords className="h-3.5 w-3.5 mr-1.5" />
            {isAuthenticated ? "Challenge" : "Sign in to Challenge"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
