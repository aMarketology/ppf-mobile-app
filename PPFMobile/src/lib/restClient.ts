/**
 * Lightweight REST helper for Supabase PostgREST.
 *
 * Used as a fallback when the supabase-js realtime WebSocket causes hangs
 * in the iOS simulator. All service files import from here instead of
 * duplicating the fetch boilerplate.
 *
 * Production note: once the iOS simulator hang is confirmed resolved,
 * migrate each service to supabase.from(...) and delete this file.
 */
import { ENV } from '../config/env';

export function sbHeaders(jwt: string): Record<string, string> {
  return {
    apikey: ENV.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${jwt}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Prefer: 'return=representation',
  };
}

export async function restGet<T>(path: string, jwt: string): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(`${ENV.SUPABASE_URL}/rest/v1/${path}`, {
      signal: ctrl.signal,
      headers: sbHeaders(jwt),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(t);
  }
}

export async function restPost<T>(
  path: string,
  body: unknown,
  jwt: string,
): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(`${ENV.SUPABASE_URL}/rest/v1/${path}`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: sbHeaders(jwt),
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(t);
  }
}

export async function restPatch<T>(
  path: string,
  body: unknown,
  jwt: string,
): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(`${ENV.SUPABASE_URL}/rest/v1/${path}`, {
      method: 'PATCH',
      signal: ctrl.signal,
      headers: sbHeaders(jwt),
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(t);
  }
}

export async function restRpc<T>(
  fn: string,
  body: unknown,
  jwt: string,
): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(`${ENV.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: sbHeaders(jwt),
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(t);
  }
}

/** Call a Supabase Edge Function */
export async function callEdgeFunction<T>(
  functionName: string,
  body: unknown,
  jwt: string,
): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch(`${ENV.API_URL}/${functionName}`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Edge Function ${functionName} error ${res.status}: ${text}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(t);
  }
}
