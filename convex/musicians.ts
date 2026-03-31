import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireMusician } from "./lib/auth";

function calculateProfileCompleteness(data: {
  bandName: string;
  bio?: string;
  genres: string[];
  location: { city: string; state: string };
  musicLinks?: {
    spotify?: string;
    bandcamp?: string;
    soundcloud?: string;
    youtube?: string;
    appleMusic?: string;
  };
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
  monthlyListeners?: number;
  avgDraw?: number;
}): number {
  let score = 0;

  // Band name (required, always present) — 10 points
  if (data.bandName) score += 10;

  // Genres — 10 points
  if (data.genres.length > 0) score += 10;

  // Location — 10 points
  if (data.location.city && data.location.state) score += 10;

  // Bio — 15 points
  if (data.bio && data.bio.length > 0) score += 15;

  // At least one music link — 20 points
  if (data.musicLinks) {
    const hasLink = Object.values(data.musicLinks).some(
      (v) => v && v.length > 0
    );
    if (hasLink) score += 20;
  }

  // At least one social link — 10 points
  if (data.socialLinks) {
    const hasLink = Object.values(data.socialLinks).some(
      (v) => v && v.length > 0
    );
    if (hasLink) score += 10;
  }

  // Monthly listeners — 10 points
  if (data.monthlyListeners && data.monthlyListeners > 0) score += 10;

  // Average draw — 15 points
  if (data.avgDraw && data.avgDraw > 0) score += 15;

  return score;
}

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("musicians")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const getById = query({
  args: { musicianId: v.id("musicians") },
  handler: async (ctx, args) => {
    const musician = await ctx.db.get(args.musicianId);
    if (!musician) return null;
    const user = await ctx.db.get(musician.userId);
    return { ...musician, userName: user?.name };
  },
});

export const create = mutation({
  args: {
    bandName: v.string(),
    genres: v.array(v.string()),
    location: v.object({
      city: v.string(),
      state: v.string(),
    }),
    bio: v.optional(v.string()),
    musicLinks: v.optional(
      v.object({
        spotify: v.optional(v.string()),
        bandcamp: v.optional(v.string()),
        soundcloud: v.optional(v.string()),
        youtube: v.optional(v.string()),
        appleMusic: v.optional(v.string()),
      })
    ),
    socialLinks: v.optional(
      v.object({
        instagram: v.optional(v.string()),
        facebook: v.optional(v.string()),
        twitter: v.optional(v.string()),
        website: v.optional(v.string()),
      })
    ),
    monthlyListeners: v.optional(v.number()),
    avgDraw: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError("User not found");
    if (user.role !== "musician")
      throw new ConvexError("Musician access required");

    // Check for existing musician profile
    const existing = await ctx.db
      .query("musicians")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (existing) throw new ConvexError("Musician profile already exists");

    const profileCompleteness = calculateProfileCompleteness(args);

    const musicianId = await ctx.db.insert("musicians", {
      userId: user._id,
      bandName: args.bandName,
      genres: args.genres,
      location: args.location,
      bio: args.bio,
      musicLinks: args.musicLinks,
      socialLinks: args.socialLinks,
      monthlyListeners: args.monthlyListeners,
      avgDraw: args.avgDraw,
      profileCompleteness,
      isActive: true,
      createdAt: Date.now(),
    });

    // Mark onboarding complete
    await ctx.db.patch(user._id, { onboardingComplete: true });

    return musicianId;
  },
});

export const update = mutation({
  args: {
    bandName: v.optional(v.string()),
    bio: v.optional(v.string()),
    genres: v.optional(v.array(v.string())),
    location: v.optional(
      v.object({
        city: v.string(),
        state: v.string(),
      })
    ),
    musicLinks: v.optional(
      v.object({
        spotify: v.optional(v.string()),
        bandcamp: v.optional(v.string()),
        soundcloud: v.optional(v.string()),
        youtube: v.optional(v.string()),
        appleMusic: v.optional(v.string()),
      })
    ),
    socialLinks: v.optional(
      v.object({
        instagram: v.optional(v.string()),
        facebook: v.optional(v.string()),
        twitter: v.optional(v.string()),
        website: v.optional(v.string()),
      })
    ),
    monthlyListeners: v.optional(v.number()),
    avgDraw: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { musician } = await requireMusician(ctx);

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) updates[key] = value;
    }

    // Recalculate profile completeness
    const merged = {
      bandName: (args.bandName ?? musician.bandName) as string,
      bio: args.bio ?? musician.bio,
      genres: (args.genres ?? musician.genres) as string[],
      location: (args.location ?? musician.location) as {
        city: string;
        state: string;
      },
      musicLinks: args.musicLinks ?? musician.musicLinks,
      socialLinks: args.socialLinks ?? musician.socialLinks,
      monthlyListeners: args.monthlyListeners ?? musician.monthlyListeners,
      avgDraw: args.avgDraw ?? musician.avgDraw,
    };
    updates.profileCompleteness = calculateProfileCompleteness(merged);

    await ctx.db.patch(musician._id, updates);
    return null;
  },
});

export const browse = query({
  args: {
    genres: v.optional(v.array(v.string())),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let musicians = await ctx.db
      .query("musicians")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (args.genres && args.genres.length > 0) {
      const genreSet = new Set(args.genres);
      musicians = musicians.filter((m) =>
        m.genres.some((g) => genreSet.has(g))
      );
    }

    if (args.city) {
      const cityLower = args.city.toLowerCase();
      musicians = musicians.filter((m) =>
        m.location.city.toLowerCase().includes(cityLower)
      );
    }

    musicians.sort((a, b) => b.profileCompleteness - a.profileCompleteness);

    return musicians.slice(0, 50);
  },
});
