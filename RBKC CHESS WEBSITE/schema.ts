import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Player profiles - extends user with chess-specific data
export const playerProfiles = mysqlTable("player_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  displayName: varchar("displayName", { length: 128 }),
  chessRating: int("chessRating").default(1200),
  skillLevel: mysqlEnum("skillLevel", ["beginner", "intermediate", "advanced", "expert"]).default("beginner"),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  // London location (lat/lng stored as decimal strings)
  locationLat: decimal("locationLat", { precision: 10, scale: 7 }),
  locationLng: decimal("locationLng", { precision: 10, scale: 7 }),
  locationName: varchar("locationName", { length: 256 }),
  isOnline: boolean("isOnline").default(false),
  isAvailable: boolean("isAvailable").default(false),
  lastSeen: timestamp("lastSeen").defaultNow(),
  preferredVenue: varchar("preferredVenue", { length: 256 }),
  wins: int("wins").default(0),
  losses: int("losses").default(0),
  draws: int("draws").default(0),
  walletBalance: decimal("walletBalance", { precision: 10, scale: 2 }).default("0.00"),
  membershipStatus: mysqlEnum("membershipStatus", ["none", "active", "expired"]).default("none"),
  membershipExpiry: timestamp("membershipExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerProfile = typeof playerProfiles.$inferSelect;
export type InsertPlayerProfile = typeof playerProfiles.$inferInsert;

// Chess events / club sessions
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  venue: varchar("venue", { length: 256 }).notNull(),
  venueAddress: varchar("venueAddress", { length: 512 }),
  locationLat: decimal("locationLat", { precision: 10, scale: 7 }),
  locationLng: decimal("locationLng", { precision: 10, scale: 7 }),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  maxAttendees: int("maxAttendees"),
  entryFee: decimal("entryFee", { precision: 8, scale: 2 }).default("0.00"),
  imageUrl: text("imageUrl"),
  isPublished: boolean("isPublished").default(true),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

// Event RSVPs
export const eventRsvps = mysqlTable("event_rsvps", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["going", "maybe", "not_going"]).default("going"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EventRsvp = typeof eventRsvps.$inferSelect;

// Match requests between players
export const matchRequests = mysqlTable("match_requests", {
  id: int("id").autoincrement().primaryKey(),
  challengerId: int("challengerId").notNull(),
  challengedId: int("challengedId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined", "completed", "cancelled"]).default("pending"),
  venue: varchar("venue", { length: 256 }),
  locationLat: decimal("locationLat", { precision: 10, scale: 7 }),
  locationLng: decimal("locationLng", { precision: 10, scale: 7 }),
  scheduledTime: timestamp("scheduledTime"),
  message: text("message"),
  stakeId: int("stakeId"),
  result: mysqlEnum("result", ["challenger_wins", "challenged_wins", "draw", "cancelled"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MatchRequest = typeof matchRequests.$inferSelect;
export type InsertMatchRequest = typeof matchRequests.$inferInsert;

// Money-match stakes (escrow)
export const moneyStakes = mysqlTable("money_stakes", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId"),
  challengerUserId: int("challengerUserId").notNull(),
  challengedUserId: int("challengedUserId"),
  stakeAmount: decimal("stakeAmount", { precision: 10, scale: 2 }).notNull(),
  totalPot: decimal("totalPot", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["pending", "funded", "in_escrow", "paid_out", "refunded", "disputed"]).default("pending"),
  challengerFunded: boolean("challengerFunded").default(false),
  challengedFunded: boolean("challengedFunded").default(false),
  winnerId: int("winnerId"),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }).default("0.00"),
  payoutAt: timestamp("payoutAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MoneyStake = typeof moneyStakes.$inferSelect;
export type InsertMoneyStake = typeof moneyStakes.$inferInsert;

// Memberships
export const memberships = mysqlTable("memberships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["monthly", "annual"]).default("monthly"),
  fee: decimal("fee", { precision: 8, scale: 2 }).notNull(),
  venueShare: decimal("venueShare", { precision: 8, scale: 2 }).default("0.00"),
  venue: varchar("venue", { length: 256 }),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = typeof memberships.$inferInsert;

// Gallery photos
export const galleryPhotos = mysqlTable("gallery_photos", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(),
  venue: varchar("venue", { length: 256 }),
  takenAt: timestamp("takenAt"),
  uploadedBy: int("uploadedBy"),
  featured: boolean("featured").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type InsertGalleryPhoto = typeof galleryPhotos.$inferInsert;

// Notifications
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message"),
  relatedId: int("relatedId"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
