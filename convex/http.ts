import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/webhooks/polar",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const webhookId = request.headers.get("webhook-id");
    const timestamp = request.headers.get("webhook-timestamp");
    const webhookSignature = request.headers.get("webhook-signature");

    if (!webhookId || !timestamp || !webhookSignature) {
      return new Response("Missing webhook headers", { status: 401 });
    }

    // Validate webhook signature (Standard Webhooks / svix spec)
    const secret = process.env.POLAR_WEBHOOK_SECRET;
    if (!secret) {
      console.error("POLAR_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Secret may have "whsec_" or "polar_whs_" prefix — strip it and base64-decode
    const cleanSecret = secret
      .replace("whsec_", "")
      .replace("polar_whs_", "");
    const secretBytes = Uint8Array.from(
      atob(cleanSecret),
      (c) => c.charCodeAt(0)
    );

    const encoder = new TextEncoder();
    const signedContent = encoder.encode(
      `${webhookId}.${timestamp}.${body}`
    );

    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, signedContent);
    const expectedSignature = btoa(
      String.fromCharCode(...new Uint8Array(mac))
    );

    // Polar sends space-separated signatures prefixed with "v1,"
    const signatures = webhookSignature.split(" ");
    const isValid = signatures.some((sig) => {
      const parts = sig.split(",");
      return parts.length === 2 && parts[1] === expectedSignature;
    });

    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    // Validate timestamp (reject if older than 5 minutes)
    const ts = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > 300) {
      return new Response("Timestamp too old", { status: 401 });
    }

    // Parse and handle event
    const event = JSON.parse(body);
    const eventType = event.type as string;

    if (
      eventType === "subscription.created" ||
      eventType === "subscription.updated"
    ) {
      const subscription = event.data;
      const convexUserId = subscription.metadata?.convexUserId;
      if (!convexUserId) {
        return new Response("Missing convexUserId in metadata", {
          status: 400,
        });
      }

      const isActive = subscription.status === "active";
      await ctx.runMutation(internal.subscriptions.updateSubscription, {
        convexUserId,
        subscriptionId: subscription.id,
        tier: isActive ? "pro" : "free",
      });
    }

    if (eventType === "subscription.canceled") {
      const subscription = event.data;
      const convexUserId = subscription.metadata?.convexUserId;
      if (!convexUserId) {
        return new Response("Missing convexUserId in metadata", {
          status: 400,
        });
      }
      await ctx.runMutation(internal.subscriptions.updateSubscription, {
        convexUserId,
        subscriptionId: subscription.id,
        tier: "free",
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
