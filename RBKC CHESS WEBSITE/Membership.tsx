import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Crown, MapPin, PoundSterling, Shield, Star, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

const BENEFITS = [
  "Access to all club sessions at partner venues",
  "Priority RSVP for tournaments and special events",
  "Appear on the live Match Maker map",
  "Money-match staking feature unlocked",
  "Official RBKC Chess Community member badge",
  "Monthly newsletter and chess tips",
  "Access to coaching sessions with Leonel Hapi",
];

const VENUES = [
  "Chelsea Library",
  "Brompton Library",
  "Earls Court Community Centre",
];

export default function Membership() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: myMembership } = trpc.memberships.mine.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const joinMutation = trpc.memberships.join.useMutation({
    onSuccess: (data) => {
      utils.memberships.mine.invalidate();
      toast.success(`Membership activated! £${data.venueShare.toFixed(2)} goes to your chosen venue.`);
    },
    onError: () => toast.error("Failed to activate membership. Please try again."),
  });

  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [venue, setVenue] = useState(VENUES[0]);

  const handleJoin = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    joinMutation.mutate({ type: plan, venue });
  };

  const isActive = myMembership?.status === "active";
  const expiryDate = myMembership?.endDate ? new Date(myMembership.endDate) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="navy-gradient py-16">
        <div className="container text-center">
          <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-4">
            Membership
          </Badge>
          <h1 className="text-4xl font-serif font-bold text-white mb-3">Join the Community</h1>
          <p className="text-white/80 max-w-lg mx-auto">
            Become an official RBKC Chess Community member. Support your local venue and unlock all platform features.
          </p>
        </div>
      </div>

      <div className="container py-12 max-w-5xl">
        {/* Active membership banner */}
        {isActive && expiryDate && (
          <div className="mb-8 p-5 rounded-xl bg-green-50 border border-green-200 flex items-center gap-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
            <div>
              <h3 className="font-serif font-bold text-green-800">You're an Active Member!</h3>
              <p className="text-sm text-green-700 mt-0.5">
                Your {myMembership.type} membership is active until{" "}
                <strong>{format(expiryDate, "d MMMM yyyy")}</strong>.
                {myMembership.venue && ` Supporting ${myMembership.venue}.`}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pricing cards */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-serif font-bold text-primary">Choose Your Plan</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Monthly */}
              <Card
                className={`cursor-pointer transition-all ${
                  plan === "monthly"
                    ? "ring-2 ring-primary border-primary shadow-md"
                    : "hover:shadow-md"
                }`}
                onClick={() => setPlan("monthly")}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-serif text-primary">Monthly</CardTitle>
                    {plan === "monthly" && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1 mb-4">
                    <span className="text-4xl font-serif font-bold text-primary">£10</span>
                    <span className="text-muted-foreground mb-1">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1.5">
                    <div className="flex items-center gap-2">
                      <PoundSterling className="h-3.5 w-3.5 text-secondary" />
                      £2.50 goes to your venue
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-secondary" />
                      Cancel anytime
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Annual */}
              <Card
                className={`cursor-pointer transition-all relative ${
                  plan === "annual"
                    ? "ring-2 ring-secondary border-secondary shadow-md"
                    : "hover:shadow-md"
                }`}
                onClick={() => setPlan("annual")}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-secondary text-secondary-foreground text-xs px-3">
                    Best Value
                  </Badge>
                </div>
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-serif text-primary">Annual</CardTitle>
                    {plan === "annual" && (
                      <CheckCircle2 className="h-5 w-5 text-secondary" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-serif font-bold text-primary">£100</span>
                    <span className="text-muted-foreground mb-1">/year</span>
                  </div>
                  <div className="text-xs text-green-600 font-medium mb-3">Save £20 vs monthly</div>
                  <div className="text-sm text-muted-foreground space-y-1.5">
                    <div className="flex items-center gap-2">
                      <PoundSterling className="h-3.5 w-3.5 text-secondary" />
                      £25 goes to your venue
                    </div>
                    <div className="flex items-center gap-2">
                      <Crown className="h-3.5 w-3.5 text-secondary" />
                      Priority member status
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Venue selection */}
            <div>
              <Label className="text-sm font-semibold text-primary mb-2 block">
                Choose Your Home Venue
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                25% of your membership fee goes directly to support your chosen venue.
              </p>
              <Select value={venue} onValueChange={setVenue}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VENUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-secondary" />
                        {v}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Revenue breakdown */}
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-4">
                <h4 className="font-semibold text-primary text-sm mb-3">
                  How Your Membership Fee is Used
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Venue support (25%)</span>
                    <span className="font-medium text-green-600">
                      £{plan === "monthly" ? "2.50" : "25.00"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Club operations (50%)</span>
                    <span className="font-medium">
                      £{plan === "monthly" ? "5.00" : "50.00"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Chess equipment & events (25%)</span>
                    <span className="font-medium">
                      £{plan === "monthly" ? "2.50" : "25.00"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              onClick={handleJoin}
              disabled={joinMutation.isPending || isActive}
            >
              <Crown className="h-4 w-4 mr-2" />
              {isActive
                ? "Already a Member"
                : joinMutation.isPending
                ? "Processing..."
                : isAuthenticated
                ? `Join for £${plan === "monthly" ? "10/month" : "100/year"}`
                : "Sign In to Join"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By joining, you agree to the RBKC Chess Community terms. Payment is processed securely.
            </p>
          </div>

          {/* Benefits sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-primary flex items-center gap-2">
                  <Star className="h-5 w-5 text-secondary" />
                  Member Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {BENEFITS.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-semibold text-primary">Community Impact</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your membership directly funds chess equipment, venue partnerships, and coaching programmes for young players in RBKC.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
