import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createEvent,
  createMatchRequest,
  createMembership,
  createMoneyStake,
  createNotification,
  getAllEvents,
  getAllMemberships,
  getAllPlayers,
  getActiveMembership,
  getAdminStats,
  getEventById,
  getEventRsvpCount,
  getGalleryPhotos,
  getMatchRequestsForUser,
  getNotificationsForUser,
  getOnlinePlayers,
  getPlayerProfileByUserId,
  getRsvpForEvent,
  getStakeById,
  getStakesForUser,
  getUpcomingEvents,
  markNotificationsRead,
  updateMatchStatus,
  updatePlayerPresence,
  updateStakeStatus,
  upsertPlayerProfile,
  upsertRsvp,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Gallery ─────────────────────────────────────────────────────────────
  gallery: router({
    list: publicProcedure
      .input(z.object({ featuredOnly: z.boolean().optional() }).optional())
      .query(({ input }) => getGalleryPhotos(input?.featuredOnly ?? false)),
  }),

  // ─── Events ──────────────────────────────────────────────────────────────
  events: router({
    upcoming: publicProcedure.query(() => getUpcomingEvents()),
    all: publicProcedure.query(() => getAllEvents()),
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getEventById(input.id)),

    rsvp: protectedProcedure
      .input(z.object({ eventId: z.number(), status: z.enum(["going", "maybe", "not_going"]) }))
      .mutation(async ({ input, ctx }) => {
        await upsertRsvp(input.eventId, ctx.user.id, input.status);
        return { success: true };
      }),

    myRsvp: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(({ input, ctx }) => getRsvpForEvent(input.eventId, ctx.user.id)),

    rsvpCount: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(({ input }) => getEventRsvpCount(input.eventId)),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          venue: z.string().min(1),
          venueAddress: z.string().optional(),
          startTime: z.number(),
          endTime: z.number().optional(),
          maxAttendees: z.number().optional(),
          entryFee: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await createEvent({
          title: input.title,
          description: input.description,
          venue: input.venue,
          venueAddress: input.venueAddress,
          startTime: new Date(input.startTime),
          endTime: input.endTime ? new Date(input.endTime) : undefined,
          maxAttendees: input.maxAttendees,
          entryFee: input.entryFee?.toFixed(2),
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  // ─── Player Profiles ─────────────────────────────────────────────────────
  players: router({
    me: protectedProcedure.query(({ ctx }) => getPlayerProfileByUserId(ctx.user.id)),

    all: publicProcedure.query(() => getAllPlayers()),
    online: publicProcedure.query(() => getOnlinePlayers()),

    upsertProfile: protectedProcedure
      .input(
        z.object({
          displayName: z.string().optional(),
          chessRating: z.number().min(100).max(3000).optional(),
          skillLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
          bio: z.string().optional(),
          locationLat: z.number().optional(),
          locationLng: z.number().optional(),
          locationName: z.string().optional(),
          preferredVenue: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await upsertPlayerProfile({
          userId: ctx.user.id,
          ...input,
          locationLat: input.locationLat?.toFixed(7),
          locationLng: input.locationLng?.toFixed(7),
        });
        return { success: true };
      }),

    setPresence: protectedProcedure
      .input(z.object({ isOnline: z.boolean(), isAvailable: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        // Ensure profile exists
        const existing = await getPlayerProfileByUserId(ctx.user.id);
        if (!existing) {
          await upsertPlayerProfile({
            userId: ctx.user.id,
            displayName: ctx.user.name ?? "Player",
            isOnline: input.isOnline,
            isAvailable: input.isAvailable,
          });
        } else {
          await updatePlayerPresence(ctx.user.id, input.isOnline, input.isAvailable);
        }
        return { success: true };
      }),
  }),

  // ─── Match Requests ───────────────────────────────────────────────────────
  matches: router({
    myMatches: protectedProcedure.query(({ ctx }) => getMatchRequestsForUser(ctx.user.id)),

    request: protectedProcedure
      .input(
        z.object({
          challengedUserId: z.number(),
          venue: z.string().optional(),
          message: z.string().optional(),
          stakeAmount: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        let stakeId: number | undefined;

        if (input.stakeAmount && input.stakeAmount > 0) {
          stakeId = await createMoneyStake({
            challengerUserId: ctx.user.id,
            challengedUserId: input.challengedUserId,
            stakeAmount: input.stakeAmount.toFixed(2),
            totalPot: (input.stakeAmount * 2).toFixed(2),
            platformFee: (input.stakeAmount * 0.05).toFixed(2),
          });
        }

        const matchId = await createMatchRequest({
          challengerId: ctx.user.id,
          challengedId: input.challengedUserId,
          venue: input.venue,
          message: input.message,
          stakeId,
        });

        await createNotification({
          userId: input.challengedUserId,
          type: "match_request",
          title: "New Match Request",
          message: `You have received a match challenge${input.stakeAmount ? ` with £${input.stakeAmount} stake` : ""}`,
          relatedId: matchId,
        });

        return { success: true, matchId };
      }),

    respond: protectedProcedure
      .input(z.object({ matchId: z.number(), accept: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const status = input.accept ? "accepted" : "declined";
        await updateMatchStatus(input.matchId, status);
        return { success: true };
      }),

    complete: protectedProcedure
      .input(
        z.object({
          matchId: z.number(),
          result: z.enum(["challenger_wins", "challenged_wins", "draw"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateMatchStatus(input.matchId, "completed", input.result);
        return { success: true };
      }),
  }),

  // ─── Money Stakes ─────────────────────────────────────────────────────────
  stakes: router({
    myStakes: protectedProcedure.query(({ ctx }) => getStakesForUser(ctx.user.id)),

    fund: protectedProcedure
      .input(z.object({ stakeId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const stake = await getStakeById(input.stakeId);
        if (!stake) throw new TRPCError({ code: "NOT_FOUND" });

        const isChallenger = stake.challengerUserId === ctx.user.id;
        const isChallenged = stake.challengedUserId === ctx.user.id;
        if (!isChallenger && !isChallenged) throw new TRPCError({ code: "FORBIDDEN" });

        const update: Record<string, unknown> = {};
        if (isChallenger) update.challengerFunded = true;
        if (isChallenged) update.challengedFunded = true;

        const bothFunded =
          (isChallenger && stake.challengedFunded) || (isChallenged && stake.challengerFunded);

        await updateStakeStatus(
          input.stakeId,
          bothFunded ? "in_escrow" : "funded",
          update as any
        );
        return { success: true };
      }),

    payout: protectedProcedure
      .input(z.object({ stakeId: z.number(), winnerId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await updateStakeStatus(input.stakeId, "paid_out", {
          winnerId: input.winnerId,
          payoutAt: new Date(),
        } as any);
        return { success: true };
      }),
  }),

  // ─── Memberships ──────────────────────────────────────────────────────────
  memberships: router({
    mine: protectedProcedure.query(({ ctx }) => getActiveMembership(ctx.user.id)),

    join: protectedProcedure
      .input(
        z.object({
          type: z.enum(["monthly", "annual"]),
          venue: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const fee = input.type === "annual" ? 100 : 10;
        const venueShare = fee * 0.25;
        const endDate = new Date();
        if (input.type === "annual") {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        await createMembership({
          userId: ctx.user.id,
          type: input.type,
          fee: fee.toFixed(2),
          venueShare: venueShare.toFixed(2),
          venue: input.venue,
          endDate,
        });

        await upsertPlayerProfile({
          userId: ctx.user.id,
          membershipStatus: "active",
          membershipExpiry: endDate,
        });

        return { success: true, fee, venueShare };
      }),

    all: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getAllMemberships();
    }),
  }),

  // ─── Notifications ────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => getNotificationsForUser(ctx.user.id)),
    markRead: protectedProcedure.mutation(({ ctx }) => markNotificationsRead(ctx.user.id)),
  }),

  // ─── Admin ────────────────────────────────────────────────────────────────
  admin: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getAdminStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
