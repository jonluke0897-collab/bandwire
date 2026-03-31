import { v } from "convex/values";
import { query } from "./_generated/server";

export const getForOpenDate = query({
  args: { openDateId: v.id("openDates") },
  handler: async (ctx, args) => {
    const openDate = await ctx.db.get(args.openDateId);
    if (!openDate) return [];

    const venue = await ctx.db.get(openDate.venueId);
    if (!venue) return [];

    const musicians = await ctx.db
      .query("musicians")
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.gte(q.field("profileCompleteness"), 60)
        )
      )
      .collect();

    const openDateGenreSet = new Set(openDate.genres);

    const scored = musicians.map((musician) => {
      let score = 0;
      const matchReasons: string[] = [];

      const sharedGenres = musician.genres.filter((g) =>
        openDateGenreSet.has(g)
      );
      if (sharedGenres.length > 0) {
        score += sharedGenres.length * 50;
        matchReasons.push(
          `${sharedGenres.length} shared genre${sharedGenres.length > 1 ? "s" : ""}`
        );
      }

      if (
        musician.location.city.toLowerCase() ===
        venue.location.city.toLowerCase()
      ) {
        score += 30;
        matchReasons.push("Same city");
      }

      score += musician.profileCompleteness * 0.2;
      if (musician.profileCompleteness >= 80) {
        matchReasons.push("Complete profile");
      }

      return { musician, score, matchReasons };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  },
});
