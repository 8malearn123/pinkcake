/**
 * Notification core — pure, runtime-agnostic types.
 *
 * This whole folder is the SINGLE SOURCE OF TRUTH for notification logic and is
 * mirrored verbatim into the Supabase Edge Function by
 * `scripts/sync-notification-core.mjs` (run `npm run notify:sync`). Keep every
 * file here free of: React, the DOM, the `@/` alias, and any remote/Deno import,
 * so the exact same code runs in the browser test suite (vitest) and in Deno.
 */

/** Channels we can deliver over. SMS is the baseline; WhatsApp is opt-in. */
export type NotificationChannel = 'sms' | 'whatsapp';

/** Supported gateways. `mock` records-and-succeeds for local/dev and tests. */
export type NotificationProviderName = 'mock' | 'unifonic' | 'msegat' | 'twilio';

/** Everything a template needs to render a customer-facing message. */
export interface OrderContext {
  orderNumber: string;
  customerName: string | null;
  storeName: string;
  branchName: string | null;
  trackingCode: string | null;
  /** App origin used to build the tracking link, e.g. https://app.example.com */
  trackingBaseUrl: string | null;
}

/** A message ready to hand to a provider. `to` must already be E.164. */
export interface OutboundMessage {
  to: string;
  body: string;
  channel: NotificationChannel;
}

/** Per-provider credentials. Only the fields a given provider needs are set. */
export interface ProviderConfig {
  /** Unifonic AppSid / Msegat apiKey / generic API key. */
  apiKey?: string;
  /** SMS sender name shown to the recipient (Unifonic SenderID / Msegat userSender). */
  senderId?: string;
  /** Msegat account username. */
  username?: string;
  /** Twilio Account SID. */
  accountSid?: string;
  /** Twilio auth token. */
  authToken?: string;
  /** Twilio "from" number / WhatsApp-enabled sender. */
  from?: string;
}

/** Normalised outcome of a single provider call. */
export interface ProviderResult {
  ok: boolean;
  /** Provider-side message id, when the gateway returns one. */
  id?: string;
  error?: string;
}

/** The HTTP request a provider would issue — pure data, so it is unit-testable. */
export interface ProviderRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}
