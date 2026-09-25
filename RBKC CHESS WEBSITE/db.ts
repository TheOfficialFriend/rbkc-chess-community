import { and, desc, eq, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Event,
  EventRsvp,
  GalleryPhoto,
  InsertEvent,
  InsertMembership,
  InsertMoneyStake,
  InsertPlayerProfile,
  InsertUser,
  MatchRequest,
  Membership,
  MoneyStake,
  Notification,
  PlayerProfile,
  eventRsvps,
  events,
  galleryPhotos,
  matchRequests,
  memberships,
  moneyStakes,
  notifications,
  playerProfiles,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Player Profiles ─────────────────────────────────────────────────────────

export async function getPlayerProfileByUserId(userId: number): Promise<PlayerProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertPlayerProfile(data: InsertPlayerProfile): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(playerProfiles).values(data).onDuplicateKeyUpdate({ set: data });
}

export async function updatePlayerPresence(userId: number, isOnline: boolean, isAvailable: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(playerProfiles)
    .set({ isOnline, isAvailable, lastSeen: new Date() })
    .where(eq(playerProfiles.userId, userId));
}

export async function getOnlinePlayers(): Promise<(PlayerProfile & { userName: string | null })[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: playerProfiles.id,
      userId: playerProfiles.userId,
      displayName: playerProfiles.displayName,
      chessRating: playerProfiles.chessRating,
      skillLevel: playerProfiles.skillLevel,
      bio: playerProfiles.bio,
      avatarUrl: playerProfiles.avatarUrl,
      locationLat: playerProfiles.locationLat,
      locationLng: playerProfiles.locationLng,
      locationName: playerProfiles.locationName,
      isOnline: playerProfiles.isOnline,
      isAvailable: playerProfiles.isAvailable,
      lastSeen: playerProfiles.lastSeen,
      preferredVenue: playerProfiles.preferredVenue,
      wins: playerProfiles.wins,
      losses: playerProfiles.losses,
      draws: playerProfiles.draws,
      walletBalance: playerProfiles.walletBalance,
      membershipStatus: playerProfiles.membershipStatus,
      membershipExpiry: playerProfiles.membershipExpiry,
      createdAt: playerProfiles.createdAt,
      updatedAt: playerProfiles.updatedAt,
      userName: users.name,
    })
    .from(playerProfiles)
    .leftJoin(users, eq(users.id, playerProfiles.userId))
    .where(eq(playerProfiles.isOnline, true));
  return result as (PlayerProfile & { userName: string | null })[];
}

export async function getAllPlayers(): Promise<(PlayerProfile & { userName: string | null })[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: playerProfiles.id,
      userId: playerProfiles.userId,
      displayName: playerProfiles.displayName,
      chessRating: playerProfiles.chessRating,
      skillLevel: playerProfiles.skillLevel,
      bio: playerProfiles.bio,
      avatarUrl: playerProfiles.avatarUrl,
      locationLat: playerProfiles.locationLat,
      locationLng: playerProfiles.locationLng,
      locationName: playerProfiles.locationName,
      isOnline: playerProfiles.isOnline,
      isAvailable: playerProfiles.isAvailable,
      lastSeen: playerProfiles.lastSeen,
      preferredVenue: playerProfiles.preferredVenue,
      wins: playerProfiles.wins,
      losses: playerProfiles.losses,
      draws: playerProfiles.draws,
      walletBalance: playerProfiles.walletBalance,
      membershipStatus: playerProfiles.membershipStatus,
      membershipExpiry: playerProfiles.membershipExpiry,
      createdAt: playerProfiles.createdAt,
      updatedAt: playerProfiles.updatedAt,
      userName: users.name,
    })
    .from(playerProfiles)
    .leftJoin(users, eq(users.id, playerProfiles.userId))
    .orderBy(desc(playerProfiles.chessRating));
  return result as (PlayerProfile & { userName: string | null })[];
}

// ─── Events ──────────────────────────────────────────────────────────────────

export async function getUpcomingEvents(): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(events)
    .where(and(eq(events.isPublished, true), sql`${events.startTime} >= NOW()`))
    .orderBy(events.startTime);
}

export async function getAllEvents(): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).orderBy(desc(events.startTime));
}

export async function getEventById(id: number): Promise<Event | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result[0];
}

export async function createEvent(data: InsertEvent): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(events).values(data);
}

export async function getRsvpForEvent(eventId: number, userId: number): Promise<EventRsvp | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
    .limit(1);
  return result[0];
}

export async function upsertRsvp(eventId: number, userId: number, status: "going" | "maybe" | "not_going"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(eventRsvps)
    .values({ eventId, userId, status })
    .onDuplicateKeyUpdate({ set: { status } });
}

export async function getEventRsvpCount(eventId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.status, "going")));
  return Number(result[0]?.count ?? 0);
}

// ─── Match Requests ───────────────────────────────────────────────────────────

export async function createMatchRequest(data: {
  challengerId: number;
  challengedId: number;
  venue?: string;
  message?: string;
  stakeId?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(matchRequests).values(data);
  return (result as any)[0]?.insertId ?? 0;
}

export async function getMatchRequestsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const challenger = db.$with('challenger').as(
    db.select({ id: users.id, name: users.name }).from(users)
  );
  const challenged = db.$with('challenged').as(
    db.select({ id: users.id, name: users.name }).from(users)
  );
  const rows = await db
    .select({
      id: matchRequests.id,
      challengerUserId: matchRequests.challengerId,
      challengedUserId: matchRequests.challengedId,
      status: matchRequests.status,
      venue: matchRequests.venue,
      message: matchRequests.message,
      stakeId: matchRequests.stakeId,
      result: matchRequests.result,
      createdAt: matchRequests.createdAt,
      updatedAt: matchRequests.updatedAt,
      winnerId: matchRequests.result,
      stakeAmount: moneyStakes.stakeAmount,
      challengerName: sql<string>`c.name`,
      challengedName: sql<string>`d.name`,
    })
    .from(matchRequests)
    .leftJoin(moneyStakes, eq(moneyStakes.id, matchRequests.stakeId))
    .leftJoin(sql`users c`, sql`c.id = ${matchRequests.challengerId}`)
    .leftJoin(sql`users d`, sql`d.id = ${matchRequests.challengedId}`)
    .where(sql`${matchRequests.challengerId} = ${userId} OR ${matchRequests.challengedId} = ${userId}`)
    .orderBy(desc(matchRequests.createdAt));
  return rows;
}

export async function updateMatchStatus(
  matchId: number,
  status: "accepted" | "declined" | "completed" | "cancelled",
  result?: "challenger_wins" | "challenged_wins" | "draw" | "cancelled"
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(matchRequests)
    .set({ status, ...(result ? { result } : {}) })
    .where(eq(matchRequests.id, matchId));
}

// ─── Money Stakes ─────────────────────────────────────────────────────────────

export async function createMoneyStake(data: InsertMoneyStake): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(moneyStakes).values(data);
  return (result as any)[0]?.insertId ?? 0;
}

export async function getStakeById(id: number): Promise<MoneyStake | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(moneyStakes).where(eq(moneyStakes.id, id)).limit(1);
  return result[0];
}

export async function updateStakeStatus(
  stakeId: number,
  status: "pending" | "funded" | "in_escrow" | "paid_out" | "refunded" | "disputed",
  extra?: Partial<MoneyStake>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(moneyStakes)
    .set({ status, ...extra })
    .where(eq(moneyStakes.id, stakeId));
}

export async function getStakesForUser(userId: number): Promise<MoneyStake[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(moneyStakes)
    .where(
      sql`${moneyStakes.challengerUserId} = ${userId} OR ${moneyStakes.challengedUserId} = ${userId}`
    )
    .orderBy(desc(moneyStakes.createdAt));
}

// ─── Memberships ──────────────────────────────────────────────────────────────

export async function createMembership(data: InsertMembership): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(memberships).values(data);
}

export async function getActiveMembership(userId: number): Promise<Membership | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.status, "active")))
    .limit(1);
  return result[0];
}

export async function getAllMemberships(): Promise<(Membership & { userName: string | null })[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: memberships.id,
      userId: memberships.userId,
      type: memberships.type,
      fee: memberships.fee,
      venueShare: memberships.venueShare,
      venue: memberships.venue,
      startDate: memberships.startDate,
      endDate: memberships.endDate,
      status: memberships.status,
      createdAt: memberships.createdAt,
      userName: users.name,
    })
    .from(memberships)
    .leftJoin(users, eq(users.id, memberships.userId))
    .orderBy(desc(memberships.createdAt));
  return result as (Membership & { userName: string | null })[];
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export async function getGalleryPhotos(featuredOnly = false): Promise<GalleryPhoto[]> {
  const db = await getDb();
  if (!db) return [];
  if (featuredOnly) {
    return db.select().from(galleryPhotos).where(eq(galleryPhotos.featured, true)).orderBy(desc(galleryPhotos.createdAt));
  }
  return db.select().from(galleryPhotos).orderBy(desc(galleryPhotos.createdAt));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(data: {
  userId: number;
  type: string;
  title: string;
  message?: string;
  relatedId?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getNotificationsForUser(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
}

export async function markNotificationsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;
  const [totalMembers] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [activeMemberships] = await db
    .select({ count: sql<number>`count(*)` })
    .from(memberships)
    .where(eq(memberships.status, "active"));
  const [totalRevenue] = await db
    .select({ total: sql<number>`COALESCE(SUM(fee), 0)` })
    .from(memberships);
  const [venueRevenue] = await db
    .select({ total: sql<number>`COALESCE(SUM(venueShare), 0)` })
    .from(memberships);
  const [totalMatches] = await db.select({ count: sql<number>`count(*)` }).from(matchRequests);
  const [completedMatches] = await db
    .select({ count: sql<number>`count(*)` })
    .from(matchRequests)
    .where(eq(matchRequests.status, "completed"));

  return {
    totalMembers: Number(totalMembers?.count ?? 0),
    activeMemberships: Number(activeMemberships?.count ?? 0),
    totalRevenue: Number(totalRevenue?.total ?? 0),
    venueRevenue: Number(venueRevenue?.total ?? 0),
    totalMatches: Number(totalMatches?.count ?? 0),
    completedMatches: Number(completedMatches?.count ?? 0),
  };
}
