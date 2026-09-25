import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Bell, ChevronDown, Crown, LogOut, Menu, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663428441773/CHgiAcrswzhYs7oY5fx6vF/logo_76bb0664.jpg";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/matchmaker", label: "Match Maker" },
  { href: "/gallery", label: "Gallery" },
  { href: "/membership", label: "Membership" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const { data: notifications } = trpc.notifications.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img
              src={LOGO_URL}
              alt="RBKC Chess Community"
              className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
            />
            <div className="hidden sm:block">
              <div className="font-serif font-bold text-primary text-sm leading-tight">RBKC Chess</div>
              <div className="text-xs text-muted-foreground leading-tight">Community</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth area */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link href="/profile">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center bg-destructive text-white">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2">
                      <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </div>
                      <span className="hidden sm:block text-sm font-medium max-w-24 truncate">
                        {user?.name ?? "Player"}
                      </span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Sign In
              </Button>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-3 pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
