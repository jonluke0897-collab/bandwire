import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { sendEmail, buildEmailHtml } from "./lib/email";

type EmailEventType =
  | "new_offer"
  | "offer_accepted"
  | "offer_declined"
  | "offer_countered"
  | "booking_confirmed"
  | "booking_cancelled";

const eventContent: Record<
  EmailEventType,
  {
    subject: string;
    title: string;
    bodyTemplate: (data: Record<string, string>) => string;
    ctaText: string;
    preferenceKey: "newOffers" | "offerResponses" | "bookingUpdates";
  }
> = {
  new_offer: {
    subject: "You've got a new booking offer!",
    title: "New Booking Offer",
    bodyTemplate: (d) =>
      `${d.venueName} wants to book you for ${d.date}. Check out the details and respond.`,
    ctaText: "View Offer",
    preferenceKey: "newOffers",
  },
  offer_accepted: {
    subject: "Your offer was accepted!",
    title: "You're locked in!",
    bodyTemplate: (d) =>
      `${d.otherPartyName} accepted your booking offer for ${d.date}. Time to make it official.`,
    ctaText: "View Booking",
    preferenceKey: "offerResponses",
  },
  offer_declined: {
    subject: "Offer update",
    title: "Offer Declined",
    bodyTemplate: (d) =>
      `${d.otherPartyName} passed on your offer for ${d.date}. No worries — plenty of great acts out there.`,
    ctaText: "View Offers",
    preferenceKey: "offerResponses",
  },
  offer_countered: {
    subject: "Counter-offer received",
    title: "They want to negotiate",
    bodyTemplate: (d) =>
      `${d.otherPartyName} sent a counter-offer for ${d.date}. Take a look and decide.`,
    ctaText: "View Counter-Offer",
    preferenceKey: "offerResponses",
  },
  booking_confirmed: {
    subject: "Booking confirmed!",
    title: "You're locked in!",
    bodyTemplate: (d) =>
      `Your gig on ${d.date} is confirmed. Both parties are booked. Check the details and acknowledge the contract.`,
    ctaText: "View Booking",
    preferenceKey: "bookingUpdates",
  },
  booking_cancelled: {
    subject: "Booking cancelled",
    title: "Booking Cancelled",
    bodyTemplate: (d) =>
      `A booking for ${d.date} has been cancelled.${d.reason ? ` Reason: ${d.reason}` : ""}`,
    ctaText: "View Bookings",
    preferenceKey: "bookingUpdates",
  },
};

export const sendEventEmail = internalAction({
  args: {
    userId: v.string(),
    eventType: v.string(),
    data: v.object({
      date: v.optional(v.string()),
      venueName: v.optional(v.string()),
      otherPartyName: v.optional(v.string()),
      reason: v.optional(v.string()),
      linkUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Look up user to get email and preferences
    const user = await ctx.runQuery(internal.emails.getUserForEmail, {
      userId: args.userId,
    });
    if (!user) return;

    const event = eventContent[args.eventType as EmailEventType];
    if (!event) return;

    // Check email preferences (default: all on except marketing)
    const prefs = user.emailPreferences ?? {
      newOffers: true,
      offerResponses: true,
      bookingUpdates: true,
      marketing: false,
    };
    if (!prefs[event.preferenceKey]) return;

    const dataMap: Record<string, string> = {
      date: args.data.date ?? "TBD",
      venueName: args.data.venueName ?? "",
      otherPartyName: args.data.otherPartyName ?? "",
      reason: args.data.reason ?? "",
    };

    const html = buildEmailHtml({
      title: event.title,
      body: event.bodyTemplate(dataMap),
      ctaText: event.ctaText,
      ctaUrl: args.data.linkUrl ?? "/dashboard",
    });

    await sendEmail({
      to: user.email,
      subject: event.subject,
      html,
    });
  },
});

// Internal query to get user data for email sending
import { internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getUserForEmail = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userId = args.userId as Id<"users">;
    return await ctx.db.get(userId);
  },
});
