/**
 * apns.ts — Send a push notification directly to Apple APNs HTTP/2 API.
 * Uses APNs Auth Key (.p8) — no Firebase, no certificates, no external libs.
 *
 * Required Supabase secrets:
 *   APNS_KEY_ID        – 10-char key ID from Apple Developer Portal
 *   APNS_TEAM_ID       – 10-char Apple Team ID
 *   APNS_PRIVATE_KEY   – .p8 file contents (newlines as \n in the secret)
 *   APNS_BUNDLE_ID     – iOS bundle ID e.g. com.ppf.mobile
 *   APNS_ENVIRONMENT   – "sandbox" (dev builds) | "production" (App Store)
 */

const APNS_HOST_SANDBOX    = 'https://api.sandbox.push.apple.com';
const APNS_HOST_PRODUCTION = 'https://api.push.apple.com';

// Cache the signed JWT so we don't re-sign on every notification (valid 59 min)
let cachedToken: string | null = null;
let tokenCreatedAt = 0;
const TOKEN_TTL_MS = 55 * 60 * 1000; // 55 minutes (APNs allows up to 60)

async function getApnsJwt(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now - tokenCreatedAt < TOKEN_TTL_MS) return cachedToken;

  const keyId   = Deno.env.get('APNS_KEY_ID')!;
  const teamId  = Deno.env.get('APNS_TEAM_ID')!;
  const privKey = Deno.env.get('APNS_PRIVATE_KEY')!.replace(/\\n/g, '\n');

  // Strip PEM headers and decode base64
  const pemBody = privKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const header  = btoa(JSON.stringify({ alg: 'ES256', kid: keyId })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payload = btoa(JSON.stringify({ iss: teamId, iat: Math.floor(now / 1000) })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const sigInput = `${header}.${payload}`;

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(sigInput),
  );

  // Convert DER signature to raw R||S format required by APNs
  const sig = derToRaw(new Uint8Array(signature));
  const sigB64 = btoa(String.fromCharCode(...sig)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  cachedToken   = `${sigInput}.${sigB64}`;
  tokenCreatedAt = now;
  return cachedToken;
}

/** Convert DER-encoded ECDSA signature to raw R||S (64 bytes) */
function derToRaw(der: Uint8Array): Uint8Array {
  let offset = 2; // skip SEQUENCE tag + length
  if (der[1] === 0x81) offset = 3;
  offset++; // skip INTEGER tag for R
  const rLen = der[offset++];
  const r = der.slice(offset, offset + rLen);
  offset += rLen;
  offset++; // skip INTEGER tag for S
  const sLen = der[offset++];
  const s = der.slice(offset, offset + sLen);
  const raw = new Uint8Array(64);
  raw.set(r.length === 33 ? r.slice(1) : r, 32 - Math.min(r.length, 32));
  raw.set(s.length === 33 ? s.slice(1) : s, 64 - Math.min(s.length, 32));
  return raw;
}

export interface ApnsPayload {
  title:   string;
  body:    string;
  badge?:  number;
  sound?:  string;
  data?:   Record<string, string>;
  category?: string;
}

export async function sendApns(deviceToken: string, payload: ApnsPayload): Promise<void> {
  const env        = Deno.env.get('APNS_ENVIRONMENT') ?? 'sandbox';
  const bundleId   = Deno.env.get('APNS_BUNDLE_ID')!;
  const host       = env === 'production' ? APNS_HOST_PRODUCTION : APNS_HOST_SANDBOX;
  const jwt        = await getApnsJwt();

  const body: Record<string, unknown> = {
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: payload.sound ?? 'default',
      ...(payload.badge !== undefined && { badge: payload.badge }),
      ...(payload.category && { category: payload.category }),
      'mutable-content': 1,
    },
    ...(payload.data ?? {}),
  };

  const res = await fetch(`${host}/3/device/${deviceToken}`, {
    method:  'POST',
    headers: {
      authorization:      `bearer ${jwt}`,
      'apns-topic':       bundleId,
      'apns-push-type':   'alert',
      'apns-priority':    '10',
      'content-type':     'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`APNs error ${res.status}: ${detail}`);
  }
}
