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

export const countSentThisMonth = query({
  args: {},
  handler: async (ctx) => {
    const { venue } = await requireVenue(ctx);

    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).getTime();
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    ).getTime();

    const offers = await ctx.db
      .query("offers")
      .withIndex("by_venueId", (q) => q.eq("venueId", venue._id))
      .collect();

    return offers.filter(
      (o) =>
        o.createdAt >= startOfMonth &&
        o.createdAt <= endOfMonth &&
        o.status !== "withdrawn"
    ).length;
  },
});

export const send = mutation({
  args: {
    openDateId: v.id("openDates"),
    musicianId: v.id("musicians"),
    dealType: dealTypeValidator,
    amount: v.optional(v.number()),
    splitPercentage: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    loadInTime: v.optional(v.string()),
    setLength: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, venue } = await requireVenue(ctx);

    const openDate = await ctx.db.get(args.openDateId);
    if (!openDate) throw new ConvexError("Open date not found");
    if (openDate.venueId !== venue._id)
      throw new ConvexError("Not authorized");
    if (openDate.status !== "open")
      throw new ConvexError("This date is no longer available");

    const musician = await ctx.db.get(args.musicianId);
    if (!musician) throw new ConvexError("Musician not found");

    if (user.subscriptionTier === "free") {
      const now = new Date();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).getTime();
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      ).getTime();

      const monthOffers = await ctx.db
        .query("offers")
        .withIndex("by_venueId", (q) => q.eq("venueId", venue._id))
        .collect();

      const count = monthOffers.filter(
        (o) =>
          o.createdAt >= startOfMonth &&
          o.createdAt <= endOfMonth &&
          o.status !== "withdrawn"
      ).length;

      if (count >= 5) {
        throw new ConvexError(
          "Free tier limit reached. Upgrade to Pro to send more offers."
        );
      }
    }

    const offerId = await ctx.db.insert("offers", {
      openDateId: args.openDateId,
      venueId: venue._id,
      musicianId: args.musicianId,
      senderUserId: user._id,
      recipientUserId: musician.userId,
      date: openDate.date,
      dealType: args.dealType,
      amount: args.amount,
      splitPercentage: args.splitPercentage,
      startTime: args.startTime,
      endTime: args.endTime,
      loadInTime: args.loadInTime,
      setLength: args.setLength,
      notes: args.notes,
      status: "pending",
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.openDateId, { status: "hold" });

    await ctx.db.insert("notifications", {
      userId: musician.userId,
      type: "new_offer",
      title: "New Booking Offer",
      message: `${venue.name} sent you a booking offer for ${openDate.date}`,
      relatedOfferId: offerId,
      isRead: false,
      createdAt: Date.now(),
    });

    return offerId;
  },
});

export const listSent = query({
  args: {},
  handler: async (ctx) => {
    const { venue } = await requireVenue(ctx);

    const offers = await ctx.db
      .query("offers")
      .withIndex("by_venueId", (q) => q.eq("venueId", venue._id))
      .order("desc")
      .collect();

    return await Promise.all(
      offers.map(async (offer) => {
        const musician = await ctx.db.get(offer.musicianId);
        return { ...offer, musicianBandName: musician?.bandName ?? "Unknown" };
      })
    );
  },
});
