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
  // Handle URL-safe base64
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  // React Native's built-in base64 supports this via fetch-less decoding:
  // use global.btoa? Not available either. Use a robust loop that stops at '='.
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '=') break; // padding — stop
    const v = chars.indexOf(c);
    if (v === -1) continue; // skip invalid chars
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  // Decode UTF-8 bytes to a proper string (Supabase JWTs contain plain ASCII sub/emails, but be safe)
  try {
    return decodeURIComponent(
      output.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  } catch (_) {
    return output;
  }
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

// ── Image upload to Supabase Storage ─────────────────────────────────────────

async function uploadImage(jwt: string, userId: string, dataUri: string): Promise<string | null> {
  try {
    // Extract base64 data and content type
    const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return null;
    const contentType = matches[1];
    const base64Data = matches[2];

    // Generate a unique filename
    const ext = contentType.split('/')[1] || 'jpg';
    const filename = `${userId}/${Date.now()}.${ext}`;

    // Upload to Supabase Storage bucket 'feed-images'
    const res = await fetch(`${ENV.SUPABASE_URL}/storage/v1/object/feed-images/${filename}`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Authorization: `Bearer ${jwt}`,
        apikey: ENV.SUPABASE_ANON_KEY,
      },
      body: Uint8Array.from(b64decode(base64Data), c => c.charCodeAt(0)),
    });

    if (!res.ok) {
      console.warn('[feed] image upload failed:', await res.text());
      return null;
    }

    // Return public URL
    return `${ENV.SUPABASE_URL}/storage/v1/object/public/feed-images/${filename}`;
  } catch (e) {
    console.warn('[feed] image upload error:', e);
    return null;
  }
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
  authorId?: string,
): Promise<FeedPost> {
  const currentUserId = authorId || jwtUserId(jwt);

  if (!currentUserId || currentUserId.length < 20) {
    throw new Error(`Invalid user ID: "${currentUserId}". Make sure you're signed in.`);
  }

  // Format base64 images as proper data URIs before storing
  const formattedUrls = mediaUrls.map(url => {
    if (url && !url.startsWith('data:') && !url.startsWith('http')) {
      return `data:image/jpeg;base64,${url}`;
    }
    return url;
  });

  // Create post
  const { id, created_at } = await sbPost<FeedPost>(
    'feed_posts',
    jwt,
    {
      author_id:   currentUserId,
      content,
      post_type:   postType,
      media_urls:  formattedUrls,
      budget:      budget  ?? null,
      deadline:    deadline ?? null,
      is_published: true,
    },
    'return=representation',
  );

  // 1. Fetch post with comments and bids
  const post = await sbGet<any>(
    `feed_posts?select=id,author_id,content,post_type,media_urls,likes_count,comments_count,bids_count,budget,deadline,created_at` +
    `&id=eq.${id}`,
    jwt,
  );

  if (!post) throw new Error('Post not found');

  // 2. Fetch author profile
  await fetchProfiles([post.author_id], jwt);

  // 3. Shape into FeedPost
  const fullPost: FeedPost = {
    id:             post.id,
    content:        post.content,
    post_type:      post.post_type,
    media_urls:     post.media_urls ?? [],
    likes_count:    post.likes_count ?? 0,
    comments_count: post.comments_count ?? 0,
    bids_count:     post.bids_count   ?? 0,
    budget:         post.budget       ?? null,
    deadline:       post.deadline     ?? null,
    created_at:     post.created_at,
    author:         makeAuthor(post.author_id),
    liked_by_me:    false,  // default to false, as we don't know liked state yet
  };

  return fullPost;
}

// ── Update post ───────────────────────────────────────────────────────────────

export async function updatePost(
  jwt: string,
  postId: string,
  content?: string,
  postType?: string,
  mediaUrls?: string[],
  budget?: number,
  deadline?: string,
): Promise<FeedPost> {
  // Upload any base64 images to Supabase Storage and get public URLs
  let uploadedUrls: string[] | undefined;
  if (mediaUrls) {
    uploadedUrls = [];
    for (const url of mediaUrls) {
      if (url && url.startsWith('data:')) {
        // Upload to Supabase Storage
        const uploaded = await uploadImage(jwt, jwtUserId(jwt), url);
        if (uploaded) uploadedUrls.push(uploaded);
      } else {
        uploadedUrls.push(url);
      }
    }
  }

  // Update post
  const { id, created_at } = await sbPost<FeedPost>(
    `feed_posts?id=eq.${postId}`,
    jwt,
    {
      content,
      post_type: postType,
      media_urls: uploadedUrls,
      budget,
      deadline,
    },
    'return=representation',
  );

  // 1. Fetch post with comments and bids
  const post = await sbGet<any>(
    `feed_posts?select=id,author_id,content,post_type,media_urls,likes_count,comments_count,bids_count,budget,deadline,created_at` +
    `&id=eq.${id}`,
    jwt,
  );

  if (!post) throw new Error('Post not found');

  // 2. Fetch author profile
  await fetchProfiles([post.author_id], jwt);

  // 3. Shape into FeedPost
  const fullPost: FeedPost = {
    id:             post.id,
    content:        post.content,
    post_type:      post.post_type,
    media_urls:     post.media_urls ?? [],
    likes_count:    post.likes_count ?? 0,
    comments_count: post.comments_count ?? 0,
    bids_count:     post.bids_count   ?? 0,
    budget:         post.budget       ?? null,
    deadline:       post.deadline     ?? null,
    created_at:     post.created_at,
    author:         makeAuthor(post.author_id),
    liked_by_me:    false,  // default to false, as we don't know liked state yet
  };

  return fullPost;
}

// ── Delete post ───────────────────────────────────────────────────────────────

export async function deletePost(jwt: string, postId: string): Promise<void> {
  // 1. Delete post
  await sbDelete(`feed_posts?id=eq.${postId}`, jwt);

  // 2. Delete associated comments
  await sbDelete(`feed_comments?post_id=eq.${postId}`, jwt);

  // 3. Delete associated bids
  await sbDelete(`feed_bids?post_id=eq.${postId}`, jwt);
}

// ── Likes ─────────────────────────────────────────────────────────────────────

export async function toggleLike(
  jwt: string,
  postId: string,
): Promise<{ liked: boolean }> {
  const currentUserId = jwtUserId(jwt);
  if (!currentUserId) throw new Error('Must be signed in to like');

  // Check if already liked
  const existing = await sbGet<any[]>(
    `feed_likes?post_id=eq.${postId}&user_id=eq.${currentUserId}&select=post_id`,
    jwt,
  );

  if (existing && existing.length > 0) {
    // Unlike: delete row from feed_likes
    await sbDelete(`feed_likes?post_id=eq.${postId}&user_id=eq.${currentUserId}`, jwt);
    return { liked: false };
  } else {
    // Like: insert row into feed_likes
    try {
      await sbPost('feed_likes', jwt, { post_id: postId, user_id: currentUserId }, '');
    } catch (e: any) {
      // 409 = already liked (unique constraint) — treat as success
      if (!String(e?.message ?? '').includes('409')) throw e;
    }
    return { liked: true };
  }
}

// ── Comments ─────────────────────────────────────────────────────────────────

export async function fetchComments(postId: string, jwt: string): Promise<FeedComment[]> {
  const rows = await sbGet<any[]>(
    `feed_comments?select=id,post_id,author_id,content,created_at` +
    `&post_id=eq.${postId}` +
    `&order=created_at.asc`,
    jwt,
  );

  if (!rows.length) return [];

  // 2. Fetch profiles
  const authorIds = rows.map((r: any) => r.author_id);
  await fetchProfiles(authorIds, jwt);

  // 3. Shape into FeedComment[]
  const comments: FeedComment[] = rows.map((r: any) => ({
    id:         r.id,
    post_id:    r.post_id,
    content:    r.content,
    created_at: r.created_at,
    author:     makeAuthor(r.author_id),
  }));

  return comments;
}

export async function createComment(
  jwt: string,
  postId: string,
  content: string,
  authorId?: string,
): Promise<FeedComment> {
  const currentUserId = authorId || jwtUserId(jwt);

  if (!currentUserId || currentUserId.length < 20) {
    throw new Error(`Invalid user ID: "${currentUserId}". Make sure you're signed in.`);
  }

  const rows = await sbPost<any[]>(
    'feed_comments',
    jwt,
    { post_id: postId, author_id: currentUserId, content },
    'return=representation',
  );
  const r = Array.isArray(rows) ? rows[0] : rows;
  await fetchProfiles([r.author_id], jwt);
  return {
    id: r.id,
    content: r.content,
    created_at: r.created_at,
    author: makeAuthor(r.author_id),
  };
}

export async function deleteComment(jwt: string, commentId: string): Promise<void> {
  await sbDelete(`feed_comments?id=eq.${commentId}`, jwt);
}

// ── Bids ────────────────────────────────────────────────────────────────────

export async function fetchBids(postId: string, jwt: string): Promise<FeedBid[]> {
  const rows = await sbGet<any[]>(
    `feed_bids?select=id,post_id,author_id,amount,created_at` +
    `&post_id=eq.${postId}` +
    `&order=created_at.asc`,
    jwt,
  );

  if (!rows.length) return [];

  // 2. Fetch profiles
  const authorIds = rows.map((r: any) => r.author_id);
  await fetchProfiles(authorIds, jwt);

  // 3. Shape into FeedBid[]
  const bids: FeedBid[] = rows.map((r: any) => ({
    id:         r.id,
    amount:     r.amount,
    note:       r.note ?? null,
    status:     r.status ?? 'pending',
    created_at: r.created_at,
    bidder:     makeAuthor(r.author_id),
  }));

  return bids;
}

export async function createBid(
  jwt: string,
  postId: string,
  amount: number,
  authorId?: string,
): Promise<FeedBid> {
  const currentUserId = authorId || jwtUserId(jwt);

  const rows = await sbPost<any[]>(
    'feed_bids',
    jwt,
    { post_id: postId, bidder_id: currentUserId, amount, note: null },
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

// ── Deprecated: legacy names for posts, comments, bids ────────────────────────

// NOTE: These are kept for backwards compatibility with existing code
// They simply forward to the new names

export { fetchFeed as fetchPosts, createPost as postCreate, updatePost as postUpdate, deletePost as postDelete };
export { fetchComments as fetchPostComments };
export { fetchBids as fetchPostBids, createBid as postBid };
