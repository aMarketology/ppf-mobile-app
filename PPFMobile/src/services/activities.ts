/**
 * Activities service — site_activities audit ledger.
 *
 * Fetches the cryptographically chained activity feed from Supabase
 * and handles real-time subscriptions for live updates.
 *
 * Uses raw fetch (never supabase-js client — AsyncStorage hang on iOS simulator).
 */

import type { SiteActivity, ActivityType, ActivityPage } from '../lib/types';
import { restGet } from '../lib/restClient';
import { ENV } from '../config/env';

const PAGE_SIZE = 20;

// ─── profile cache ────────────────────────────────────────────────────────────

const profileCache: Record<string, {
  full_name: string;
  user_type: string;
  avatar_url: string | null;
}> = {};

async function fetchProfiles(ids: string[], jwt: string) {
  const missing = [...new Set(ids)].filter(id => id && id !== 'null' && !profileCache[id]);
  if (missing.length === 0) return;

  const idList = missing.map(id => `"${id}"`).join(',');
  const rows = await restGet<any[]>(
    `profiles?select=id,full_name,user_type,avatar_url&id=in.(${idList})`,
    jwt,
  );
  for (const r of rows) profileCache[r.id] = r;
}

// ─── fetch activities ────────────────────────────────────────────────────────

export async function fetchActivities(
  jwt: string,
  page: number = 0,
  type: ActivityType | 'all' = 'all',
  search: string = '',
): Promise<ActivityPage> {
  const offset = page * PAGE_SIZE;

  // Build query params
  let path = `site_activities?select=*&order=created_at.desc&limit=${PAGE_SIZE}&offset=${offset}`;
  if (type !== 'all') path += `&activity_type=eq.${encodeURIComponent(type)}`;
  if (search.trim()) path += `&summary=ilike.*${encodeURIComponent(search.trim())}*`;

  // Single fetch with count=exact to get both data and total in one request
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);

  let total = 0;
  let rows: any[] = [];

  try {
    const res = await fetch(`${ENV.SUPABASE_URL}/rest/v1/${path}`, {
      signal: ctrl.signal,
      headers: {
        apikey: ENV.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'count=exact',
      },
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

    // Parse content-range header for total count: "0-19/42" → total=42
    const contentRange = res.headers.get('content-range');
    if (contentRange) {
      const parts = contentRange.split('/');
      total = parseInt(parts[1] ?? '0', 10) || 0;
    }

    rows = JSON.parse(text);
  } finally {
    clearTimeout(t);
  }

  // Enrich with profiles
  const actorIds = rows.map((r: any) => r.actor_id);
  try {
    await fetchProfiles(actorIds, jwt);
  } catch (e) {
    console.warn('[activities] profile fetch failed:', e);
  }

  const activities: SiteActivity[] = rows.map((r: any) => ({
    id: r.id,
    activity_type: r.activity_type,
    actor_id: r.actor_id,
    target_type: r.target_type,
    target_id: r.target_id,
    summary: r.summary,
    metadata: r.metadata ?? null,
    previous_hash: r.previous_hash,
    row_hash: r.row_hash,
    created_at: r.created_at,
    actor: {
      full_name: (r.actor_id && profileCache[r.actor_id]?.full_name) ?? 'Unknown',
      avatar_url: r.actor_id ? (profileCache[r.actor_id]?.avatar_url ?? null) : null,
      user_type: r.actor_id ? (profileCache[r.actor_id]?.user_type ?? 'vendor') : 'vendor',
    },
  }));

  return {
    activities,
    page,
    hasMore: offset + PAGE_SIZE < total,
    total,
  };
}

// ─── real-time subscription helper ───────────────────────────────────────────
// Note: imported from @supabase/supabase-js, but only the supabase instance
// (not supabase-js client) is used for realtime. This is intentional —
// the realtime WebSocket is per-screen, not persistent.

/**
 * Subscribe to new activities in real time.
 * Returns an unsubscribe function.
 *
 * Usage:
 *   const unsub = subscribeToActivities(jwt, (newActivity) => {
 *     setActivities(prev => [newActivity, ...prev]);
 *   });
 *   // on unmount: unsub();
 */
export function subscribeToActivities(
  jwt: string,
  onInsert: (activity: SiteActivity) => void,
): () => void {
  // Build WebSocket URL for Supabase Realtime
  const wsUrl = ENV.SUPABASE_URL
    .replace(/^https?:\/\//, 'wss://')
    .replace(/\/$/, '');

  const channelName = `site_activities_live_${Date.now()}`;
  const ws = new WebSocket(
    `${wsUrl}/realtime/v1/websocket?apikey=${ENV.SUPABASE_ANON_KEY}&vsn=1.0.0`,
  );

  ws.onopen = () => {
    // Join the realtime channel
    ws.send(
      JSON.stringify({
        topic: `realtime:public:site_activities`,
        event: 'phx_join',
        payload: {
          config: {
            broadcast: { self: true },
            presence: { key: '' },
            postgres_changes: [
              {
                event: 'INSERT',
                schema: 'public',
                table: 'site_activities',
              },
            ],
          },
        },
        ref: channelName,
      }),
    );
    // Heartbeat every 30s
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: channelName }));
      }
    }, 30_000);
    ws.addEventListener('close', () => clearInterval(heartbeat));
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.event === 'postgres_changes' && msg.payload) {
        const row = msg.payload.data?.record ?? msg.payload;
        if (!row || !row.actor_id) return;

        // Enrich actor from cache or fetch
        const actor = profileCache[row.actor_id] ?? {
          full_name: 'Loading...',
          avatar_url: null,
          user_type: 'vendor',
        };

        // If cache miss, try fetching
        if (!profileCache[row.actor_id]) {
          const fetchActor = async () => {
            await fetchProfiles([row.actor_id], jwt);
            // We can't easily update the already-emitted activity,
            // but the next one will have the cached profile
          };
          fetchActor();
        }

        onInsert({
          id: row.id,
          activity_type: row.activity_type,
          actor_id: row.actor_id,
          target_type: row.target_type,
          target_id: row.target_id,
          summary: row.summary,
          metadata: row.metadata ?? null,
          previous_hash: row.previous_hash,
          row_hash: row.row_hash,
          created_at: row.created_at ?? new Date().toISOString(),
          actor,
        });
      }
    } catch {
      // ignore malformed messages
    }
  };

  return () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.send(
        JSON.stringify({
          topic: `realtime:public:site_activities`,
          event: 'phx_leave',
          payload: {},
          ref: channelName,
        }),
      );
      ws.close();
    }
  };
}