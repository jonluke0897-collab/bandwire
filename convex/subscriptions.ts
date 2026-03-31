import { v } from "convex/values";
import { query, action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser } from "./lib/auth";
import { Id } from "./_generated/dataModel";

export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    if (user.role !== "venue") {
      return {
        tier: user.subscriptionTier as "free" | "pro",
        offersThisMonth: 0,
        offerLimit: -1,
        canSendOffer: true,
      };
    }

    const venue = await ctx.db
      .query("venues")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    let offersThisMonth = 0;
    if (venue) {
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

      offersThisMonth = offers.filter(
        (o) =>
          o.createdAt >= startOfMonth &&
          o.createdAt <= endOfMonth &&
          o.status !== "withdrawn"
      ).length;
    }

    const isFree = user.subscriptionTier === "free";

    return {
      tier: user.subscriptionTier as "free" | "pro",
      offersThisMonth,
      offerLimit: isFree ? 5 : -1,
      canSendOffer: !isFree || offersThisMonth < 5,
    };
  },
});

export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const createCheckout = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user: { _id: string; email: string } | null = await ctx.runQuery(
      internal.subscriptions.getUserByClerkId,
      { clerkId: identity.subject }
    );
    if (!user) throw new Error("User not found");

    const polarToken = process.env.POLAR_ACCESS_TOKEN;
    const priceId = process.env.POLAR_PRICE_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    if (!polarToken || !priceId) {
      throw new Error(
        "Polar is not configured. Set POLAR_ACCESS_TOKEN and POLAR_PRICE_ID in Convex environment."
      );
    }

    const response: Response = await fetch(
      "https://api.polar.sh/v1/checkouts/custom/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${polarToken}`,
        },
        body: JSON.stringify({
          product_price_id: priceId,
          success_url: `${appUrl}/dashboard/settings?checkout=success`,
          customer_email: user.email,
          metadata: {
            convexUserId: user._id,
          },
        }),
      }
    );

    if (!response.ok) {
      const text: string = await response.text();
      throw new Error(`Polar checkout failed: ${text}`);
    }

    const data: { url: string } = await response.json();
    return data.url;
  },
});

export const updateSubscription = internalMutation({
  args: {
    convexUserId: v.string(),
    subscriptionId: v.string(),
    tier: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, args) => {
    const userId = args.convexUserId as Id<"users">;
    const user = await ctx.db.get(userId);
    if (!user) throw new Error(`User not found: ${args.convexUserId}`);

    await ctx.db.patch(user._id, {
      subscriptionTier: args.tier,
      subscriptionId: args.subscriptionId,
    });
  },
});
