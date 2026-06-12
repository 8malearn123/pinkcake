// AUTO-GENERATED — do not edit by hand.
// Source: src/lib/notifications/providers.ts · regenerate: npm run notify:sync

import type {
  NotificationProviderName,
  OutboundMessage,
  ProviderConfig,
  ProviderRequest,
  ProviderResult,
} from './types.ts';

/**
 * A provider is two pure functions — `buildRequest` (message → HTTP request) and
 * `parseResponse` (HTTP result → normalised outcome) — so both halves are
 * unit-testable without touching the network. `sendViaProvider` glues them to a
 * `fetch` (injectable for tests).
 *
 * NOTE: the exact endpoints/fields below follow each gateway's documented SMS
 * API at the time of writing. Verify against your provider's current docs before
 * going live (see docs/notifications.md).
 */
export interface ProviderDef {
  name: NotificationProviderName;
  buildRequest(msg: OutboundMessage, cfg: ProviderConfig): ProviderRequest;
  parseResponse(httpStatus: number, bodyText: string): ProviderResult;
}

const digitsOnly = (e164: string): string => e164.replace(/^\+/, '');

function safeJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Unifonic (KSA) — classic REST SMS endpoint, form-encoded. */
const unifonic: ProviderDef = {
  name: 'unifonic',
  buildRequest(msg, cfg) {
    const params = new URLSearchParams({
      AppSid: cfg.apiKey ?? '',
      SenderID: cfg.senderId ?? '',
      Body: msg.body,
      Recipient: digitsOnly(msg.to),
      responseType: 'JSON',
    });
    return {
      url: 'https://el.cloud.unifonic.com/rest/SMS/messages',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    };
  },
  parseResponse(httpStatus, bodyText) {
    const json = safeJson(bodyText);
    const ok = httpStatus >= 200 && httpStatus < 300 && json.success === 'true';
    const data = (json.data ?? {}) as Record<string, unknown>;
    return ok
      ? { ok: true, id: (data.MessageID ?? data.messageId) as string | undefined }
      : { ok: false, error: (json.message as string) ?? `HTTP ${httpStatus}` };
  },
};

/** Msegat (KSA) — JSON SMS gateway. */
const msegat: ProviderDef = {
  name: 'msegat',
  buildRequest(msg, cfg) {
    return {
      url: 'https://www.msegat.com/gw/sendsms.php',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: cfg.username ?? '',
        apiKey: cfg.apiKey ?? '',
        userSender: cfg.senderId ?? '',
        numbers: digitsOnly(msg.to),
        msg: msg.body,
      }),
    };
  },
  parseResponse(httpStatus, bodyText) {
    const json = safeJson(bodyText);
    // Msegat returns code "1" on success.
    const ok = httpStatus >= 200 && httpStatus < 300 && String(json.code) === '1';
    return ok
      ? { ok: true, id: json.id as string | undefined }
      : { ok: false, error: (json.message as string) ?? `code ${json.code ?? httpStatus}` };
  },
};

/** Twilio — works for both SMS and WhatsApp (channel prefixes the addresses). */
const twilio: ProviderDef = {
  name: 'twilio',
  buildRequest(msg, cfg) {
    const prefix = msg.channel === 'whatsapp' ? 'whatsapp:' : '';
    const params = new URLSearchParams({
      To: `${prefix}${msg.to}`,
      From: `${prefix}${cfg.from ?? ''}`,
      Body: msg.body,
    });
    const auth = base64(`${cfg.accountSid ?? ''}:${cfg.authToken ?? ''}`);
    return {
      url: `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid ?? ''}/Messages.json`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: params.toString(),
    };
  },
  parseResponse(httpStatus, bodyText) {
    const json = safeJson(bodyText);
    const ok = httpStatus >= 200 && httpStatus < 300 && !!json.sid;
    return ok
      ? { ok: true, id: json.sid as string }
      : { ok: false, error: (json.message as string) ?? `HTTP ${httpStatus}` };
  },
};

/** Runtime-agnostic base64 (browser `btoa`, else Buffer in Node/Deno). */
function base64(input: string): string {
  if (typeof btoa === 'function') return btoa(input);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).Buffer.from(input, 'utf-8').toString('base64');
}

const PROVIDERS: Record<string, ProviderDef> = { unifonic, msegat, twilio };

export interface SendDeps {
  /** Injectable for tests; defaults to the platform `fetch`. */
  fetch?: typeof fetch;
  /** Invoked instead of any network call when provider is `mock`. */
  onMock?: (msg: OutboundMessage) => void;
}

/** Send one message and return a normalised result (never throws on HTTP). */
export async function sendViaProvider(
  provider: NotificationProviderName,
  msg: OutboundMessage,
  cfg: ProviderConfig,
  deps: SendDeps = {}
): Promise<ProviderResult> {
  if (provider === 'mock') {
    deps.onMock?.(msg);
    return { ok: true, id: `mock-${Date.now()}` };
  }

  const def = PROVIDERS[provider];
  if (!def) return { ok: false, error: `unknown provider: ${provider}` };

  const doFetch = deps.fetch ?? globalThis.fetch;
  const req = def.buildRequest(msg, cfg);
  const res = await doFetch(req.url, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });
  const text = await res.text();
  return def.parseResponse(res.status, text);
}

/** Throwing wrapper so `withRetry` treats a failed send as a retryable error. */
export async function sendOrThrow(
  provider: NotificationProviderName,
  msg: OutboundMessage,
  cfg: ProviderConfig,
  deps: SendDeps = {}
): Promise<string> {
  const result = await sendViaProvider(provider, msg, cfg, deps);
  if (!result.ok) throw new Error(result.error ?? 'provider send failed');
  return result.id ?? '';
}

export { unifonic, msegat, twilio };
