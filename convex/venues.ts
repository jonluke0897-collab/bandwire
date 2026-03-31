import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireVenue } from "./lib/auth";

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("venues")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const getById = query({
  args: { venueId: v.id("venues") },
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.venueId);
    if (!venue) return null;
    const user = await ctx.db.get(venue.userId);
    return { ...venue, userName: user?.name };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    location: v.object({
      city: v.string(),
      state: v.string(),
      address: v.optional(v.string()),
    }),
    capacity: v.number(),
    genres: v.array(v.string()),
    defaultDealType: v.union(
      v.literal("flat_fee"),
      v.literal("door_split"),
      v.literal("ticket_split"),
      v.literal("bar_split"),
      v.literal("other")
    ),
    defaultBudgetMin: v.optional(v.number()),
    defaultBudgetMax: v.optional(v.number()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError("User not found");
    if (user.role !== "venue") throw new ConvexError("Venue access required");

    // Check for existing venue profile
    const existing = await ctx.db
      .query("venues")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (existing) throw new ConvexError("Venue profile already exists");

    const venueId = await ctx.db.insert("venues", {
      userId: user._id,
      name: args.name,
      location: args.location,
      capacity: args.capacity,
      genres: args.genres,
      defaultDealType: args.defaultDealType,
      defaultBudgetMin: args.defaultBudgetMin,
      defaultBudgetMax: args.defaultBudgetMax,
      website: args.website,
      isActive: true,
      createdAt: Date.now(),
    });

    // Mark onboarding complete
    await ctx.db.patch(user._id, { onboardingComplete: true });

    return venueId;
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(
      v.object({
        city: v.string(),
        state: v.string(),
        address: v.optional(v.string()),
      })
    ),
    capacity: v.optional(v.number()),
    genres: v.optional(v.array(v.string())),
    defaultDealType: v.optional(
      v.union(
        v.literal("flat_fee"),
        v.literal("door_split"),
        v.literal("ticket_split"),
        v.literal("bar_split"),
        v.literal("other")
      )
    ),
    defaultBudgetMin: v.optional(v.number()),
    defaultBudgetMax: v.optional(v.number()),
    website: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        instagram: v.optional(v.string()),
        facebook: v.optional(v.string()),
        twitter: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { venue } = await requireVenue(ctx);

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(venue._id, updates);
    return null;
  },
});

export const browse = query({
  args: {
    genres: v.optional(v.array(v.string())),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let venues = await ctx.db
      .query("venues")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (args.genres && args.genres.length > 0) {
      const genreSet = new Set(args.genres);
      venues = venues.filter((v) => v.genres.some((g) => genreSet.has(g)));
    }

    if (args.city) {
      const cityLower = args.city.toLowerCase();
      venues = venues.filter((v) =>
        v.location.city.toLowerCase().includes(cityLower)
      );
    }

    venues.sort((a, b) => b.createdAt - a.createdAt);

    return venues.slice(0, 50);
  },
});
