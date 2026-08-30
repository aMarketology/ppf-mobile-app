/**
 * fcm.ts — Send a push notification to Android via FCM HTTP v1 API.
 * Uses a Google service account JWT — NO Firebase SDK on the device.
 *
 * Required Supabase secrets:
 *   FCM_PROJECT_ID          – Firebase project ID (e.g. ppf-mobile-12345)
 *   FCM_SERVICE_ACCOUNT_JSON – Full service account JSON as a single-line string
 */

interface ServiceAccount {
  client_email: string;
  private_key:  string;
  project_id:   string;
}

// Cache OAuth2 access token (valid 1 hour from Google)
let cachedAccessToken: string | null = null;
let accessTokenExpiresAt = 0;

async function getFcmAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && now < accessTokenExpiresAt - 60_000) return cachedAccessToken;

  const sa: ServiceAccount = JSON.parse(Deno.env.get('FCM_SERVICE_ACCOUNT_JSON')!);

  // Build JWT for Google OAuth2 token exchange
  const header  = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const iat     = Math.floor(now / 1000);
  const exp     = iat + 3600;
  const claims  = {
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:   'https://oauth2.googleapis.com/token',
    iat,
    exp,
  };
  const payload = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const sigInput = `${header}.${payload}`;

  // Import RSA private key
  const pemBody = sa.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sigBytes = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(sigInput));
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwtToken = `${sigInput}.${sig}`;

  // Exchange JWT for OAuth2 access token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body:    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwtToken}`,
  });

  if (!res.ok) throw new Error(`FCM token exchange failed: ${await res.text()}`);
  const json = await res.json();
  cachedAccessToken    = json.access_token;
  accessTokenExpiresAt = now + (json.expires_in * 1000);
  return cachedAccessToken!;
}

export interface FcmPayload {
  title: string;
  body:  string;
  data?: Record<string, string>;
}

export async function sendFcm(deviceToken: string, payload: FcmPayload): Promise<void> {
  const projectId   = Deno.env.get('FCM_PROJECT_ID')!;
  const accessToken = await getFcmAccessToken();

  const message = {
    message: {
      token: deviceToken,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
      android: {
        priority: 'high',
        notification: {
          channel_id: (payload.data?.ppf_type?.startsWith('new_message') || payload.data?.ppf_type === 'new_quote_request')
            ? 'messages'
            : payload.data?.ppf_type?.startsWith('order') || payload.data?.ppf_type === 'new_order_received'
            ? 'orders'
            : payload.data?.ppf_type?.startsWith('connection')
            ? 'social'
            : payload.data?.ppf_type === 'new_feed_post'
            ? 'feed'
            : payload.data?.ppf_type === 'product_price_drop'
            ? 'marketplace'
            : 'account',
        },
      },
    },
  };

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method:  'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(message),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`FCM error ${res.status}: ${detail}`);
  }
}
