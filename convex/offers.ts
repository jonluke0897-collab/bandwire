import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireVenue, requireMusician, requireUser } from "./lib/auth";

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

export const listReceived = query({
  args: {},
  handler: async (ctx) => {
    const { musician } = await requireMusician(ctx);

    const offers = await ctx.db
      .query("offers")
      .withIndex("by_musicianId", (q) => q.eq("musicianId", musician._id))
      .order("desc")
      .collect();

    return await Promise.all(
      offers.map(async (offer) => {
        const venue = await ctx.db.get(offer.venueId);
        return { ...offer, venueName: venue?.name ?? "Unknown" };
      })
    );
  },
});

export const getById = query({
  args: { offerId: v.id("offers") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const offer = await ctx.db.get(args.offerId);
    if (!offer) return null;

    if (offer.senderUserId !== user._id && offer.recipientUserId !== user._id) {
      throw new ConvexError("Not authorized");
    }

    const venue = await ctx.db.get(offer.venueId);
    const musician = await ctx.db.get(offer.musicianId);
    const openDate = await ctx.db.get(offer.openDateId);

    return {
      ...offer,
      venueName: venue?.name ?? "Unknown",
      venueLocation: venue?.location,
      venueCapacity: venue?.capacity,
      musicianBandName: musician?.bandName ?? "Unknown",
      musicianLocation: musician?.location,
      musicianGenres: musician?.genres ?? [],
      openDateGenres: openDate?.genres ?? [],
    };
  },
});

export const accept = mutation({
  args: { offerId: v.id("offers") },
  handler: async (ctx, args) => {
    const { user, musician } = await requireMusician(ctx);

    const offer = await ctx.db.get(args.offerId);
    if (!offer) throw new ConvexError("Offer not found");
    if (offer.musicianId !== musician._id)
      throw new ConvexError("Not authorized");
    if (offer.status !== "pending")
      throw new ConvexError("Offer is no longer pending");

    const venue = await ctx.db.get(offer.venueId);

    // Create booking
    const bookingId = await ctx.db.insert("bookings", {
      offerId: offer._id,
      openDateId: offer.openDateId,
      venueId: offer.venueId,
      musicianId: musician._id,
      venueUserId: offer.senderUserId,
      musicianUserId: user._id,
      date: offer.date,
      startTime: offer.startTime,
      endTime: offer.endTime,
      loadInTime: offer.loadInTime,
      setLength: offer.setLength,
      dealType: offer.dealType,
      amount: offer.amount,
      splitPercentage: offer.splitPercentage,
      notes: offer.notes,
      status: "confirmed",
      contractGenerated: true,
      contractAcknowledgedByVenue: false,
      contractAcknowledgedByMusician: false,
      createdAt: Date.now(),
    });

    // Update offer status
    await ctx.db.patch(args.offerId, {
      status: "accepted",
      respondedAt: Date.now(),
    });

    // Set open date to booked
    await ctx.db.patch(offer.openDateId, { status: "booked" });

    // Notify venue
    await ctx.db.insert("notifications", {
      userId: offer.senderUserId,
      type: "offer_accepted",
      title: "Offer Accepted!",
      message: `${musician.bandName} accepted your booking offer for ${offer.date}`,
      linkUrl: `/dashboard/bookings/${bookingId}`,
      relatedOfferId: offer._id,
      relatedBookingId: bookingId,
      isRead: false,
      createdAt: Date.now(),
    });

    return bookingId;
  },
});

export const decline = mutation({
  args: {
    offerId: v.id("offers"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { musician } = await requireMusician(ctx);

    const offer = await ctx.db.get(args.offerId);
    if (!offer) throw new ConvexError("Offer not found");
    if (offer.musicianId !== musician._id)
      throw new ConvexError("Not authorized");
    if (offer.status !== "pending")
      throw new ConvexError("Offer is no longer pending");

    await ctx.db.patch(args.offerId, {
      status: "declined",
      respondedAt: Date.now(),
    });

    // Set open date back to open
    await ctx.db.patch(offer.openDateId, { status: "open" });

    // Notify venue
    const reasonText = args.reason ? ` Reason: ${args.reason}` : "";
    await ctx.db.insert("notifications", {
      userId: offer.senderUserId,
      type: "offer_declined",
      title: "Offer Declined",
      message: `${musician.bandName} declined your booking offer for ${offer.date}.${reasonText}`,
      linkUrl: `/dashboard/offers`,
      relatedOfferId: offer._id,
      isRead: false,
      createdAt: Date.now(),
    });

    return null;
  },
});

export const counter = mutation({
  args: {
    offerId: v.id("offers"),
    counterOffer: v.object({
      amount: v.optional(v.number()),
      splitPercentage: v.optional(v.number()),
      dealType: v.optional(dealTypeValidator),
      notes: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { musician } = await requireMusician(ctx);

    const offer = await ctx.db.get(args.offerId);
    if (!offer) throw new ConvexError("Offer not found");
    if (offer.musicianId !== musician._id)
      throw new ConvexError("Not authorized");
    if (offer.status !== "pending")
      throw new ConvexError("Offer is no longer pending");

    await ctx.db.patch(args.offerId, {
      status: "countered",
      counterOffer: args.counterOffer,
      respondedAt: Date.now(),
    });

    // Notify venue
    await ctx.db.insert("notifications", {
      userId: offer.senderUserId,
      type: "offer_countered",
      title: "Counter-Offer Received",
      message: `${musician.bandName} sent a counter-offer for ${offer.date}`,
      linkUrl: `/dashboard/offers/${offer._id}`,
      relatedOfferId: offer._id,
      isRead: false,
      createdAt: Date.now(),
    });

    return null;
  },
});

export const acceptCounter = mutation({
  args: { offerId: v.id("offers") },
  handler: async (ctx, args) => {
    const { user, venue } = await requireVenue(ctx);

    const offer = await ctx.db.get(args.offerId);
    if (!offer) throw new ConvexError("Offer not found");
    if (offer.venueId !== venue._id) throw new ConvexError("Not authorized");
    if (offer.status !== "countered")
      throw new ConvexError("Offer is not in countered state");

    const musician = await ctx.db.get(offer.musicianId);
    if (!musician) throw new ConvexError("Musician not found");

    // Use counter-offer terms, falling back to original
    const co = offer.counterOffer;
    const bookingId = await ctx.db.insert("bookings", {
      offerId: offer._id,
      openDateId: offer.openDateId,
      venueId: venue._id,
      musicianId: offer.musicianId,
      venueUserId: user._id,
      musicianUserId: offer.recipientUserId,
      date: offer.date,
      startTime: offer.startTime,
      endTime: offer.endTime,
      loadInTime: offer.loadInTime,
      setLength: offer.setLength,
      dealType: co?.dealType ?? offer.dealType,
      amount: co?.amount ?? offer.amount,
      splitPercentage: co?.splitPercentage ?? offer.splitPercentage,
      notes: co?.notes ?? offer.notes,
      status: "confirmed",
      contractGenerated: true,
      contractAcknowledgedByVenue: false,
      contractAcknowledgedByMusician: false,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.offerId, {
      status: "accepted",
      respondedAt: Date.now(),
    });

    await ctx.db.patch(offer.openDateId, { status: "booked" });

    // Notify musician
    await ctx.db.insert("notifications", {
      userId: offer.recipientUserId,
      type: "offer_accepted",
      title: "Counter-Offer Accepted!",
      message: `${venue.name} accepted your counter-offer for ${offer.date}`,
      linkUrl: `/dashboard/bookings/${bookingId}`,
      relatedOfferId: offer._id,
      relatedBookingId: bookingId,
      isRead: false,
      createdAt: Date.now(),
    });

    return bookingId;
  },
});

export const withdraw = mutation({
  args: { offerId: v.id("offers") },
  handler: async (ctx, args) => {
    const { venue } = await requireVenue(ctx);

    const offer = await ctx.db.get(args.offerId);
    if (!offer) throw new ConvexError("Offer not found");
    if (offer.venueId !== venue._id) throw new ConvexError("Not authorized");
    if (offer.status !== "pending" && offer.status !== "countered")
      throw new ConvexError("Offer cannot be withdrawn");

    await ctx.db.patch(args.offerId, { status: "withdrawn" });
    await ctx.db.patch(offer.openDateId, { status: "open" });

    return null;
  },
});
