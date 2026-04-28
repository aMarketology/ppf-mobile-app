/**
 * Feed service — raw fetch directly to Supabase REST.
 *
 * The web platform API (precisionprojectflow.com) is not yet deployed,
 * so all feed operations go straight to Supabase.
 * Never use supabase-js client (AsyncStorage hang on iOS simulator).
 */

import type { FeedPost, FeedPage, FeedComment, FeedBid } from '../lib/types';
import { sbHeaders, restGet, restPost } from '../lib/restClient';
import { ENV } from '../config/env';

const PAGE_SIZE = 20;

// React Native doesn't expose atob — use a pure-JS base64 decoder
function b64decode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  // Handle URL-safe base64
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  let output = '';
  let i = 0;
  while (i < s.length) {
    const enc1 = chars.indexOf(s[i++]);
    const enc2 = chars.indexOf(s[i++]);
    const enc3 = chars.indexOf(s[i++]);
    const enc4 = chars.indexOf(s[i++]);
    output += String.fromCharCode((enc1 << 2) | (enc2 >> 4));
    if (enc3 !== 64) output += String.fromCharCode(((enc2 & 15) << 4) | (enc3 >> 2));
    if (enc4 !== 64) output += String.fromCharCode(((enc3 & 3) << 6) | enc4);
  }
  return output;
}

function jwtUserId(jwt: string): string {
  try {
    return JSON.parse(b64decode(jwt.split('.')[1])).sub ?? '';
  } catch (_) {
    return '';
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function sbGet<T>(path: string, jwt: string): Promise<T> {
  return restGet<T>(path, jwt);
}

async function sbPost<T>(path: string, jwt: string, body: unknown, prefer = ''): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(`${ENV.SUPABASE_URL}/rest/v1/${path}`, {
      method: 'POST',
      headers: { ...sbHeaders(jwt), ...(prefer ? { Prefer: prefer } : {}) },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`[feed] POST ${res.status}: ${text}`);
    return text ? JSON.parse(text) as T : ({} as T);
  } finally { clearTimeout(t); }
}

async function sbDelete(path: string, jwt: string): Promise<void> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(`${ENV.SUPABASE_URL}/rest/v1/${path}`, {
      method: 'DELETE',
      headers: sbHeaders(jwt),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`[feed] DELETE ${res.status}`);
  } finally { clearTimeout(t); }
}

// ── profile cache (per session — avoids N+1) ─────────────────────────────────

const profileCache: Record<string, { full_name: string; user_type: string; avatar_url: string | null }> = {};

async function fetchProfiles(ids: string[], jwt: string) {
  const missing = [...new Set(ids)].filter(id => !profileCache[id]);
  if (missing.length > 0) {
    const rows = await sbGet<any[]>(
      `profiles?select=id,full_name,user_type,avatar_url&id=in.(${missing.join(',')})`,
      jwt,
    );
    for (const r of rows) profileCache[r.id] = r;
  }
}

function makeAuthor(authorId: string): FeedPost['author'] {
  const p = profileCache[authorId];
  return {
    id:           authorId,
    full_name:    p?.full_name  ?? 'Unknown',
    user_type:    p?.user_type  ?? 'vendor',
    avatar_url:   p?.avatar_url ?? null,
    company_name: null,   // profiles table has no company_name column
  };
}

// ── Feed ─────────────────────────────────────────────────────────────────────

export type { FeedPage };

export async function fetchFeed(jwt: string, page = 0, type = 'all'): Promise<FeedPage> {
  const offset = page * PAGE_SIZE;

  // Build filter
  let typeFilter = '';
  if (type !== 'all') typeFilter = `&post_type=eq.${encodeURIComponent(type)}`;

  // 1. Fetch posts
  const rows = await sbGet<any[]>(
    `feed_posts?select=id,author_id,content,post_type,media_urls,likes_count,comments_count,bids_count,budget,deadline,created_at` +
    `&is_published=eq.true${typeFilter}` +
    `&order=created_at.desc&limit=${PAGE_SIZE}&offset=${offset}`,
    jwt,
  );

  if (!rows.length) return { posts: [], page, hasMore: false };

  // 2. Fetch profiles
  const authorIds = rows.map((r: any) => r.author_id);
  await fetchProfiles(authorIds, jwt);

  // 3. Fetch liked state for current user
  const postIds = rows.map((r: any) => r.id);
  // Decode JWT to get user id
  const currentUserId = jwtUserId(jwt);

  let likedSet = new Set<string>();
  if (currentUserId) {
    const likes = await sbGet<any[]>(
      `feed_likes?select=post_id&user_id=eq.${currentUserId}&post_id=in.(${postIds.join(',')})`,
      jwt,
    );
    likedSet = new Set(likes.map((l: any) => l.post_id));
  }

  // 4. Shape into FeedPost[]
  const posts: FeedPost[] = rows.map((r: any) => ({
    id:             r.id,
    content:        r.content,
    post_type:      r.post_type,
    media_urls:     r.media_urls ?? [],
    likes_count:    r.likes_count ?? 0,
    comments_count: r.comments_count ?? 0,
    bids_count:     r.bids_count   ?? 0,
    budget:         r.budget       ?? null,
    deadline:       r.deadline     ?? null,
    created_at:     r.created_at,
    author:         makeAuthor(r.author_id),
    liked_by_me:    likedSet.has(r.id),
  }));

  return { posts, page, hasMore: rows.length === PAGE_SIZE };
}

// ── Create post ───────────────────────────────────────────────────────────────

export async function createPost(
  jwt: string,
  content: string,
  postType: string  = 'update',
  mediaUrls: string[] = [],
  budget?: number,
  deadline?: string,
): Promise<FeedPost> {
  const currentUserId = jwtUserId(jwt);

  const rows = await sbPost<any[]>(
    'feed_posts',
    jwt,
    {
      author_id:   currentUserId,
      content,
      post_type:   postType,
      media_urls:  mediaUrls,
      budget:      budget  ?? null,
      deadline:    deadline ?? null,
      is_published: true,
    },
    'return=representation',
  );

  const r = Array.isArray(rows) ? rows[0] : rows;
  await fetchProfiles([r.author_id], jwt);
  return {
    id:             r.id,
    content:        r.content,
    post_type:      r.post_type,
    media_urls:     r.media_urls ?? [],
    likes_count:    0,
    comments_count: 0,
    bids_count:     0,
    budget:         r.budget   ?? null,
    deadline:       r.deadline ?? null,
    created_at:     r.created_at,
    author:         makeAuthor(r.author_id),
    liked_by_me:    false,
  };
}

// ── Likes ─────────────────────────────────────────────────────────────────────

export async function toggleLike(
  jwt: string,
  postId: string,
): Promise<{ liked: boolean; likes_count: number }> {
  const currentUserId = jwtUserId(jwt);

  // Check if already liked
  const existing = await sbGet<any[]>(
    `feed_likes?post_id=eq.${postId}&user_id=eq.${currentUserId}`,
    jwt,
  );

  if (existing.length > 0) {
    // Unlike
    await sbDelete(`feed_likes?post_id=eq.${postId}&user_id=eq.${currentUserId}`, jwt);
    // Decrement counter
    await fetch(`${ENV.SUPABASE_URL}/rest/v1/feed_posts?id=eq.${postId}`, {
      method: 'PATCH',
      headers: sbHeaders(jwt),
      body: JSON.stringify({ likes_count: Math.max(0, ((await sbGet<any[]>(`feed_posts?select=likes_count&id=eq.${postId}`, jwt))[0]?.likes_count ?? 1) - 1) }),
    });
    return { liked: false, likes_count: 0 };
  } else {
    // Like
    await sbPost('feed_likes', jwt, { post_id: postId, user_id: currentUserId }, '');
    return { liked: true, likes_count: 0 };
  }
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function fetchComments(jwt: string, postId: string): Promise<FeedComment[]> {
  const rows = await sbGet<any[]>(
    `feed_comments?select=id,content,created_at,author_id&post_id=eq.${postId}&order=created_at.asc`,
    jwt,
  );
  if (!rows.length) return [];
  await fetchProfiles(rows.map((r: any) => r.author_id), jwt);
  return rows.map((r: any) => ({
    id:         r.id,
    content:    r.content,
    created_at: r.created_at,
    author:     makeAuthor(r.author_id),
  }));
}

export async function postComment(jwt: string, postId: string, content: string): Promise<void> {
  const currentUserId = jwtUserId(jwt);
  await sbPost('feed_comments', jwt, { post_id: postId, author_id: currentUserId, content }, '');
}

// ── Bids ──────────────────────────────────────────────────────────────────────

export async function fetchBids(jwt: string, postId: string): Promise<FeedBid[]> {
  const rows = await sbGet<any[]>(
    `feed_bids?select=id,amount,note,status,created_at,bidder_id&post_id=eq.${postId}&order=amount.asc`,
    jwt,
  );
  if (!rows.length) return [];
  await fetchProfiles(rows.map((r: any) => r.bidder_id), jwt);
  return rows.map((r: any) => ({
    id:         r.id,
    amount:     r.amount,
    note:       r.note ?? null,
    status:     r.status ?? 'pending',
    created_at: r.created_at,
    bidder:     makeAuthor(r.bidder_id),
  }));
}

export async function placeBid(
  jwt: string,
  postId: string,
  amount: number,
  note?: string,
): Promise<FeedBid> {
  const currentUserId = jwtUserId(jwt);

  const rows = await sbPost<any[]>(
    'feed_bids',
    jwt,
    { post_id: postId, bidder_id: currentUserId, amount, note: note ?? null },
    'return=representation',
  );
  const r = Array.isArray(rows) ? rows[0] : rows;
  await fetchProfiles([r.bidder_id], jwt);
  return {
    id:         r.id,
    amount:     r.amount,
    note:       r.note ?? null,
    status:     r.status ?? 'pending',
    created_at: r.created_at,
    bidder:     makeAuthor(r.bidder_id),
  };
}
