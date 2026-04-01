import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users — base profile for all users, linked to Clerk identity
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("venue"),
      v.literal("musician"),
      v.literal("admin")
    ),
    username: v.string(),
    avatarUrl: v.optional(v.string()),
    onboardingComplete: v.boolean(),
    subscriptionTier: v.union(v.literal("free"), v.literal("pro")),
    subscriptionId: v.optional(v.string()),
    emailPreferences: v.optional(
      v.object({
        newOffers: v.boolean(),
        offerResponses: v.boolean(),
        bookingUpdates: v.boolean(),
        marketing: v.boolean(),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_username", ["username"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Venue profiles — one per venue-role user
  venues: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    location: v.object({
      city: v.string(),
      state: v.string(),
      address: v.optional(v.string()),
      lat: v.optional(v.number()),
      lng: v.optional(v.number()),
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
    socialLinks: v.optional(
      v.object({
        instagram: v.optional(v.string()),
        facebook: v.optional(v.string()),
        twitter: v.optional(v.string()),
      })
    ),
    photoUrls: v.optional(v.array(v.string())),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_city", ["location.city"]),

  // Musician profiles — one per musician-role user
  musicians: defineTable({
    userId: v.id("users"),
    bandName: v.string(),
    bio: v.optional(v.string()),
    genres: v.array(v.string()),
    location: v.object({
      city: v.string(),
      state: v.string(),
    }),
    memberCount: v.optional(v.number()),
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
    photoUrls: v.optional(v.array(v.string())),
    sampleTrackUrls: v.optional(v.array(v.string())),
    monthlyListeners: v.optional(v.number()),
    avgDraw: v.optional(v.number()),
    profileCompleteness: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_city", ["location.city"])
    .index("by_profileCompleteness", ["profileCompleteness"]),

  // Open dates — venues post dates they need to fill
  openDates: defineTable({
    venueId: v.id("venues"),
    userId: v.id("users"),
    date: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    genres: v.array(v.string()),
    dealType: v.union(
      v.literal("flat_fee"),
      v.literal("door_split"),
      v.literal("ticket_split"),
      v.literal("bar_split"),
      v.literal("other")
    ),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("hold"),
      v.literal("booked"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
  })
    .index("by_venueId", ["venueId"])
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_venueId_date", ["venueId", "date"]),

  // Offers — sent from venues to musicians
  offers: defineTable({
    openDateId: v.id("openDates"),
    venueId: v.id("venues"),
    musicianId: v.id("musicians"),
    senderUserId: v.id("users"),
    recipientUserId: v.id("users"),
    date: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    loadInTime: v.optional(v.string()),
    setLength: v.optional(v.number()),
    dealType: v.union(
      v.literal("flat_fee"),
      v.literal("door_split"),
      v.literal("ticket_split"),
      v.literal("bar_split"),
      v.literal("other")
    ),
    amount: v.optional(v.number()),
    splitPercentage: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("countered"),
      v.literal("expired"),
      v.literal("withdrawn")
    ),
    counterOffer: v.optional(
      v.object({
        amount: v.optional(v.number()),
        splitPercentage: v.optional(v.number()),
        dealType: v.optional(
          v.union(
            v.literal("flat_fee"),
            v.literal("door_split"),
            v.literal("ticket_split"),
            v.literal("bar_split"),
            v.literal("other")
          )
        ),
        notes: v.optional(v.string()),
      })
    ),
    expiresAt: v.optional(v.number()),
    respondedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_openDateId", ["openDateId"])
    .index("by_venueId", ["venueId"])
    .index("by_musicianId", ["musicianId"])
    .index("by_senderUserId", ["senderUserId"])
    .index("by_recipientUserId", ["recipientUserId"])
    .index("by_status", ["status"]),

  // Bookings — confirmed gigs
  bookings: defineTable({
    offerId: v.id("offers"),
    openDateId: v.id("openDates"),
    venueId: v.id("venues"),
    musicianId: v.id("musicians"),
    venueUserId: v.id("users"),
    musicianUserId: v.id("users"),
    date: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    loadInTime: v.optional(v.string()),
    setLength: v.optional(v.number()),
    dealType: v.union(
      v.literal("flat_fee"),
      v.literal("door_split"),
      v.literal("ticket_split"),
      v.literal("bar_split"),
      v.literal("other")
    ),
    amount: v.optional(v.number()),
    splitPercentage: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    contractGenerated: v.boolean(),
    contractAcknowledgedByVenue: v.boolean(),
    contractAcknowledgedByMusician: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_venueId", ["venueId"])
    .index("by_musicianId", ["musicianId"])
    .index("by_date", ["date"])
    .index("by_venueUserId", ["venueUserId"])
    .index("by_musicianUserId", ["musicianUserId"])
    .index("by_status", ["status"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("new_match"),
      v.literal("new_offer"),
      v.literal("offer_accepted"),
      v.literal("offer_declined"),
      v.literal("offer_countered"),
      v.literal("booking_confirmed"),
      v.literal("booking_cancelled"),
      v.literal("general")
    ),
    title: v.string(),
    message: v.string(),
    linkUrl: v.optional(v.string()),
    relatedOfferId: v.optional(v.id("offers")),
    relatedBookingId: v.optional(v.id("bookings")),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),
});
