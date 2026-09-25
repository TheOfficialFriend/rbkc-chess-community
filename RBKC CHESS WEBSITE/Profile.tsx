import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  Bell,
  CheckCircle2,
  Clock,
  Crown,
  MapPin,
  PoundSterling,
  Settings,
  Swords,
  Trophy,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-2xl font-serif font-bold text-primary mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to view your profile.</p>
          <Button onClick={() => (window.location.href = getLoginUrl())}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return <ProfileContent user={user} />;
}

function ProfileContent({ user }: { user: any }) {
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.players.me.useQuery();
  const { data: matches } = trpc.matches.myMatches.useQuery();
  const { data: notifications } = trpc.notifications.list.useQuery();

  const updateProfileMutation = trpc.players.upsertProfile.useMutation({
    onSuccess: () => {
      utils.players.me.invalidate();
      toast.success("Profile updated!");
    },
    onError: () => toast.error("Failed to update profile."),
  });

  const respondMatchMutation = trpc.matches.respond.useMutation({
    // @ts-ignore - router uses accept:boolean
    onSuccess: () => {
      utils.matches.myMatches.invalidate();
      utils.notifications.list.invalidate();
      toast.success("Response sent!");
    },
  });

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });

  const declareResultMutation = trpc.matches.complete.useMutation({
    onSuccess: () => {
      utils.matches.myMatches.invalidate();
      toast.success("Result recorded!");
    },
  });

  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    skillLevel: "beginner",
    locationName: "",
    chessRating: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
      displayName: profile.displayName ?? "",
      bio: profile.bio ?? "",
      skillLevel: (profile.skillLevel ?? "beginner") as string,
      locationName: profile.locationName ?? "",
      chessRating: String(profile.chessRating ?? 1200),
      });
    }
  }, [profile]);

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      displayName: form.displayName || undefined,
      bio: form.bio || undefined,
      skillLevel: form.skillLevel as any,
      locationName: form.locationName || undefined,
      chessRating: Number(form.chessRating) || undefined,
    });
  };

  const pendingMatches = (matches ?? []).filter(
    (m) => m.status === "pending" && m.challengedUserId === user?.id
  );
  const activeMatches = (matches ?? []).filter((m) => m.status === "accepted");
  const completedMatches = (matches ?? []).filter((m) =>
    ["completed", "cancelled"].includes(m.status ?? "")
  );
  const unreadNotifs = (notifications ?? []).filter((n) => !n.isRead);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="navy-gradient py-16" />
        <div className="container py-8">
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="navy-gradient py-12">
        <div className="container">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-3xl font-bold shadow-lg ring-4 ring-white/20">
              {(profile?.displayName ?? user?.name ?? "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white">
                {profile?.displayName ?? user?.name ?? "Player"}
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-xs">
                  <Trophy className="h-3 w-3 mr-1" />
                  Rating: {profile?.chessRating ?? 1200}
                </Badge>
                <Badge className="bg-white/10 text-white border-white/20 text-xs capitalize">
                  {profile?.skillLevel ?? "beginner"}
                </Badge>
                {profile?.membershipStatus && profile.membershipStatus !== "none" && (
                  <Badge className="bg-secondary text-secondary-foreground text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    {profile.membershipStatus} member
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-white/70">
                <span className="text-green-400 font-medium">{profile?.wins ?? 0}W</span>
                <span className="text-red-400 font-medium">{profile?.losses ?? 0}L</span>
                <span className="text-white/50">{profile?.draws ?? 0}D</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Tabs defaultValue="matches">
          <TabsList className="mb-6">
            <TabsTrigger value="matches" className="flex items-center gap-1.5">
              <Swords className="h-3.5 w-3.5" />
              Matches
              {pendingMatches.length > 0 && (
                <Badge className="ml-1 h-4 w-4 p-0 text-xs bg-destructive text-white flex items-center justify-center rounded-full">
                  {pendingMatches.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              Notifications
              {unreadNotifs.length > 0 && (
                <Badge className="ml-1 h-4 w-4 p-0 text-xs bg-destructive text-white flex items-center justify-center rounded-full">
                  {unreadNotifs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Matches tab */}
          <TabsContent value="matches" className="space-y-6">
            {/* Pending challenges */}
            {pendingMatches.length > 0 && (
              <div>
                <h3 className="font-serif font-semibold text-primary mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-secondary" />
                  Pending Challenges ({pendingMatches.length})
                </h3>
                <div className="space-y-3">
                  {pendingMatches.map((match) => (
                    <Card key={match.id} className="border-l-4 border-l-amber-400">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-primary text-sm">
                              Challenge from{" "}
                              <strong>{match.challengerName ?? "Unknown Player"}</strong>
                            </p>
                            {match.venue && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3 text-secondary" />
                                {match.venue}
                              </div>
                            )}
                            {match.message && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                "{match.message}"
                              </p>
                            )}
                            {match.stakeAmount && Number(match.stakeAmount) > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <PoundSterling className="h-3 w-3 text-secondary" />
                                <span className="text-xs font-semibold text-secondary">
                                  £{Number(match.stakeAmount).toFixed(2)} stake
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                              onClick={() =>
                                respondMatchMutation.mutate({
                                  matchId: match.id,
                                  accept: true,
                                } as any)
                              }
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50 h-8 text-xs"
                              onClick={() =>
                                respondMatchMutation.mutate({
                                  matchId: match.id,
                                  accept: false,
                                } as any)
                              }
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Active matches */}
            {activeMatches.length > 0 && (
              <div>
                <h3 className="font-serif font-semibold text-primary mb-3 flex items-center gap-2">
                  <Swords className="h-4 w-4 text-secondary" />
                  Active Matches
                </h3>
                <div className="space-y-3">
                  {activeMatches.map((match) => {
                    const isChallenger = match.challengerUserId === user?.id;
                    const opponentName = isChallenger
                      ? match.challengedName
                      : match.challengerName;
                    return (
                      <Card key={match.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-primary text-sm">
                                vs <strong>{opponentName ?? "Unknown"}</strong>
                              </p>
                              {match.venue && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3 text-secondary" />
                                  {match.venue}
                                </div>
                              )}
                              {match.stakeAmount && Number(match.stakeAmount) > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <PoundSterling className="h-3 w-3 text-secondary" />
                                  <span className="text-xs font-semibold text-secondary">
                                    £{Number(match.stakeAmount).toFixed(2)} stake
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                className="bg-primary text-primary-foreground h-8 text-xs"
                                onClick={() =>
                                  declareResultMutation.mutate({
                                    matchId: match.id,
                                    result: "challenger_wins",
                                  })
                                }
                              >
                                I Won
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() =>
                                  declareResultMutation.mutate({
                                    matchId: match.id,
                                    result: "draw",
                                  })
                                }
                              >
                                Draw
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Match history */}
            {completedMatches.length > 0 && (
              <div>
                <h3 className="font-serif font-semibold text-primary mb-3">Match History</h3>
                <div className="space-y-2">
                  {completedMatches.slice(0, 10).map((match) => {
                    const isChallenger = match.challengerUserId === user?.id;
                    const opponentName = isChallenger
                      ? match.challengedName
                      : match.challengerName;
                    const won =
                      match.winnerId === user?.id;
                    const lost =
                      match.status === "completed" && match.winnerId && match.winnerId !== user?.id;
                    return (
                      <div
                        key={match.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              won
                                ? "bg-green-500"
                                : lost
                                ? "bg-red-500"
                                : "bg-gray-400"
                            }`}
                          />
                          <span className="text-muted-foreground">vs</span>
                          <span className="font-medium text-primary">{opponentName ?? "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {match.stakeAmount && Number(match.stakeAmount) > 0 && (
                            <span className="text-xs text-secondary font-medium">
                              £{Number(match.stakeAmount).toFixed(2)}
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              won
                                ? "border-green-300 text-green-700 bg-green-50"
                                : lost
                                ? "border-red-300 text-red-700 bg-red-50"
                                : "border-gray-300 text-gray-600"
                            }`}
                          >
                            {won ? "Won" : lost ? "Lost" : match.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(match.createdAt), "d MMM")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {matches?.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Swords className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No matches yet. Head to the Match Maker to find an opponent!</p>
              </div>
            )}
          </TabsContent>

          {/* Notifications tab */}
          <TabsContent value="notifications">
            {notifications?.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications?.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                      !notif.isRead
                        ? "bg-secondary/5 border-secondary/30"
                        : "bg-background border-border"
                    }`}
                    onClick={() =>
                      !notif.isRead &&
                      markReadMutation.mutate()
                    }
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        !notif.isRead ? "bg-secondary" : "bg-muted-foreground/30"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(notif.createdAt), "d MMM")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings tab */}
          <TabsContent value="settings">
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle className="font-serif text-primary flex items-center gap-2">
                  <Settings className="h-5 w-5 text-secondary" />
                  Player Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    placeholder="Your chess name"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell others about your chess style..."
                    className="mt-1.5 resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="skillLevel">Skill Level</Label>
                  <Select
                    value={form.skillLevel}
                    onValueChange={(v) => setForm({ ...form, skillLevel: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="chessRating">Chess Rating (ELO)</Label>
                  <Input
                    id="chessRating"
                    type="number"
                    value={form.chessRating}
                    onChange={(e) => setForm({ ...form, chessRating: e.target.value })}
                    placeholder="1200"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="locationName">Preferred Location</Label>
                  <Input
                    id="locationName"
                    value={form.locationName}
                    onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                    placeholder="e.g. Chelsea, Kensington"
                    className="mt-1.5"
                  />
                </div>
                <Button
                  className="w-full bg-primary text-primary-foreground"
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
