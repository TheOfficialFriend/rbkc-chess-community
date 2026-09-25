import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, PoundSterling, Swords, Trophy, Users } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const { data: memberships, isLoading: membershipsLoading } = trpc.memberships.all.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-serif font-bold text-primary mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground text-sm">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Members",
      value: stats?.totalMembers ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Active Memberships",
      value: stats?.activeMemberships ?? 0,
      icon: Crown,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      title: "Total Revenue",
      value: `£${(stats?.totalRevenue ?? 0).toFixed(2)}`,
      icon: PoundSterling,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Venue Revenue",
      value: `£${(stats?.venueRevenue ?? 0).toFixed(2)}`,
      icon: Trophy,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Total Matches",
      value: stats?.totalMatches ?? 0,
      icon: Swords,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Completed Matches",
      value: stats?.completedMatches ?? 0,
      icon: Trophy,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  // Group venue revenue
  const venueBreakdown = (memberships ?? []).reduce<Record<string, number>>((acc, m) => {
    const v = m.venue ?? "Unknown";
    acc[v] = (acc[v] ?? 0) + Number(m.venueShare ?? 0);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="navy-gradient py-12">
        <div className="container">
          <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-3">
            Admin Dashboard
          </Badge>
          <h1 className="text-3xl font-serif font-bold text-white">RBKC Chess Admin</h1>
          <p className="text-white/70 mt-1 text-sm">
            Manage memberships, track revenue, and monitor community activity.
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map((s) => (
              <Card key={s.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div className="text-2xl font-serif font-bold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.title}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="memberships">
          <TabsList className="mb-6">
            <TabsTrigger value="memberships">Memberships</TabsTrigger>
            <TabsTrigger value="venues">Venue Revenue</TabsTrigger>
          </TabsList>

          {/* Memberships tab */}
          <TabsContent value="memberships">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-primary">All Memberships</CardTitle>
              </CardHeader>
              <CardContent>
                {membershipsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : (memberships ?? []).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No memberships yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Fee</TableHead>
                          <TableHead>Venue Share</TableHead>
                          <TableHead>Venue</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(memberships ?? []).map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">
                              {(m as any).userName ?? `User #${m.userId}`}
                            </TableCell>
                            <TableCell className="capitalize">{m.type}</TableCell>
                            <TableCell>£{Number(m.fee).toFixed(2)}</TableCell>
                            <TableCell className="text-green-600 font-medium">
                              £{Number(m.venueShare ?? 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {m.venue ?? "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {m.endDate ? format(new Date(m.endDate), "dd/MM/yyyy") : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  m.status === "active"
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : m.status === "expired"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-muted text-muted-foreground"
                                }
                              >
                                {m.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Venue revenue tab */}
          <TabsContent value="venues">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(venueBreakdown).length === 0 ? (
                <div className="col-span-3 text-center py-16 text-muted-foreground">
                  <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No venue revenue data yet.</p>
                </div>
              ) : (
                Object.entries(venueBreakdown).map(([venue, amount]) => (
                  <Card key={venue} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-10 h-10 rounded-full bg-secondary/15 flex items-center justify-center mb-3">
                        <PoundSterling className="h-5 w-5 text-secondary" />
                      </div>
                      <h3 className="font-serif font-bold text-primary text-lg">{venue}</h3>
                      <div className="text-3xl font-serif font-bold text-green-600 mt-1">
                        £{amount.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Total venue share received</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
