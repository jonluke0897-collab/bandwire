import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireVenue } from "./lib/auth";

const dealTypeValidator = v.union(
  v.literal("flat_fee"),
  v.literal("door_split"),
  v.literal("ticket_split"),
  v.literal("bar_split"),
  v.literal("other")
);

export const listByVenue = query({
  args: {},
  handler: async (ctx) => {
    const { venue } = await requireVenue(ctx);
    return await ctx.db
      .query("openDates")
      .withIndex("by_venueId", (q) => q.eq("venueId", venue._id))
      .order("asc")
      .collect();
  },
});

export const getById = query({
  args: { openDateId: v.id("openDates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.openDateId);
  },
});

export const create = mutation({
  args: {
    date: v.string(),
    genres: v.array(v.string()),
    dealType: dealTypeValidator,
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, venue } = await requireVenue(ctx);

    const today = new Date().toISOString().split("T")[0];
    if (args.date < today) {
      throw new ConvexError("Date must be in the future");
    }

    return await ctx.db.insert("openDates", {
      venueId: venue._id,
      userId: user._id,
      date: args.date,
      genres: args.genres,
      dealType: args.dealType,
      budgetMin: args.budgetMin,
      budgetMax: args.budgetMax,
      startTime: args.startTime,
      endTime: args.endTime,
      notes: args.notes,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    openDateId: v.id("openDates"),
    genres: v.optional(v.array(v.string())),
    dealType: v.optional(dealTypeValidator),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { venue } = await requireVenue(ctx);
    const { openDateId, ...fields } = args;

    const openDate = await ctx.db.get(openDateId);
    if (!openDate) throw new ConvexError("Open date not found");
    if (openDate.venueId !== venue._id) throw new ConvexError("Not authorized");
    if (openDate.status === "booked")
      throw new ConvexError("Cannot update a booked date");

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(openDateId, updates);
    return null;
  },
});

export const cancel = mutation({
  args: { openDateId: v.id("openDates") },
  handler: async (ctx, args) => {
    const { venue } = await requireVenue(ctx);

    const openDate = await ctx.db.get(args.openDateId);
    if (!openDate) throw new ConvexError("Open date not found");
    if (openDate.venueId !== venue._id) throw new ConvexError("Not authorized");
    if (openDate.status === "booked")
      throw new ConvexError("Cannot cancel a booked date");

    await ctx.db.patch(args.openDateId, { status: "cancelled" });
    return null;
  },
});
