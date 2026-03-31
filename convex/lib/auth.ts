import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) throw new ConvexError("User profile not found");
  return user;
}

export async function requireVenue(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);
  if (user.role !== "venue") throw new ConvexError("Venue access required");
  const venue = await ctx.db
    .query("venues")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .unique();
  if (!venue) throw new ConvexError("Venue profile not found");
  return { user, venue };
}

export async function requireMusician(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);
  if (user.role !== "musician")
    throw new ConvexError("Musician access required");
  const musician = await ctx.db
    .query("musicians")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .unique();
  if (!musician) throw new ConvexError("Musician profile not found");
  return { user, musician };
}
