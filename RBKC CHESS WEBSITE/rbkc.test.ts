import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createAnonContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test User");
  });

  it("returns null when not authenticated", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("gallery.list", () => {
  it("returns an array (public access)", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gallery.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts featuredOnly filter", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gallery.list({ featuredOnly: true });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("events.upcoming", () => {
  it("returns an array of upcoming events (public)", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.events.upcoming();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("events.all", () => {
  it("returns all events (public)", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.events.all();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("players.all", () => {
  it("returns all player profiles (public)", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.players.all();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("players.online", () => {
  it("returns online players (public)", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.players.online();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("memberships.join", () => {
  it("throws UNAUTHORIZED for anonymous users", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.memberships.join({ type: "monthly" })
    ).rejects.toThrow();
  });
});

describe("events.create", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.events.create({
        title: "Test Event",
        venue: "Chelsea Library",
        startTime: Date.now() + 86400000,
      })
    ).rejects.toThrow();
  });
});

describe("admin.stats", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });
});

describe("stakes.payout", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.stakes.payout({ stakeId: 1, winnerId: 2 })
    ).rejects.toThrow();
  });
});

describe("notifications.list", () => {
  it("throws UNAUTHORIZED for anonymous users", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notifications.list()).rejects.toThrow();
  });
});
