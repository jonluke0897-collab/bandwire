import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    return user;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.union(v.literal("venue"), v.literal("musician")),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (existing) throw new ConvexError("User already exists");

    // Validate username uniqueness
    const usernameExists = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (usernameExists) throw new ConvexError("Username already taken");

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      name: args.name,
      role: args.role,
      username: args.username,
      onboardingComplete: false,
      subscriptionTier: "free",
      createdAt: Date.now(),
    });

    return userId;
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    onboardingComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError("User not found");

    // Validate username uniqueness if changing
    if (args.username && args.username !== user.username) {
      const usernameExists = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username!))
        .unique();
      if (usernameExists) throw new ConvexError("Username already taken");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.username !== undefined) updates.username = args.username;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
    if (args.onboardingComplete !== undefined)
      updates.onboardingComplete = args.onboardingComplete;

    await ctx.db.patch(user._id, updates);
    return null;
  },
});
