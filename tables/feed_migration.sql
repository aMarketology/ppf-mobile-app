-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: feed like helpers + push notification columns
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Atomic increment / decrement for feed_posts.likes_count
--    Called by the mobile app when a user likes / unlikes a post.
--    Using UPDATE with arithmetic avoids race conditions vs. read-then-write.

CREATE OR REPLACE FUNCTION public.increment_post_likes(p_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE feed_posts
  SET likes_count = likes_count + 1,
      updated_at  = now()
  WHERE id = p_post_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_post_likes(p_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE feed_posts
  SET likes_count = GREATEST(0, likes_count - 1),
      updated_at  = now()
  WHERE id = p_post_id;
$$;

-- Atomic bid count increment (called by placeBid edge function or trigger)
CREATE OR REPLACE FUNCTION public.increment_post_bids(p_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE feed_posts
  SET bids_count = bids_count + 1,
      updated_at = now()
  WHERE id = p_post_id;
$$;

-- Atomic comment count increment
CREATE OR REPLACE FUNCTION public.increment_post_comments(p_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE feed_posts
  SET comments_count = comments_count + 1,
      updated_at     = now()
  WHERE id = p_post_id;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_post_likes(uuid)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_post_likes(uuid)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_post_bids(uuid)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_post_comments(uuid) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Push notification columns on profiles
--    Required by ALL notify-* Supabase edge functions.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token               TEXT,
  ADD COLUMN IF NOT EXISTS push_platform            TEXT
    CHECK (push_platform IN ('ios', 'android')),
  ADD COLUMN IF NOT EXISTS push_enabled             BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_feed_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_low_token_notified_at TIMESTAMPTZ;

-- Index for fast push dispatching (edge functions filter on push_token IS NOT NULL)
CREATE INDEX IF NOT EXISTS idx_profiles_push_token
  ON public.profiles (push_token)
  WHERE push_token IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. feed_likes table (if it doesn't exist yet)
--    Low-cardinality; one row per (user, post) pair.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feed_likes (
  post_id    UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- RLS: users can only see/insert/delete their own likes
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "feed_likes_select" ON public.feed_likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "feed_likes_insert" ON public.feed_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "feed_likes_delete" ON public.feed_likes
  FOR DELETE USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. feed_comments table (if it doesn't exist yet)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feed_comments (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID        NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_id  UUID        NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_comments_post
  ON public.feed_comments (post_id, created_at ASC);

ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "feed_comments_select" ON public.feed_comments
  FOR SELECT USING (true);   -- public read

CREATE POLICY IF NOT EXISTS "feed_comments_insert" ON public.feed_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY IF NOT EXISTS "feed_comments_delete" ON public.feed_comments
  FOR DELETE USING (auth.uid() = author_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. feed_bids table (if it doesn't exist yet)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feed_bids (
  id         UUID           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID           NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  bidder_id  UUID           NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
  amount     NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  note       TEXT,
  status     TEXT           NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ    NOT NULL DEFAULT now(),
  UNIQUE (post_id, bidder_id)   -- one bid per user per post
);

CREATE INDEX IF NOT EXISTS idx_feed_bids_post
  ON public.feed_bids (post_id, amount ASC);

ALTER TABLE public.feed_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "feed_bids_select" ON public.feed_bids
  FOR SELECT USING (true);   -- all authenticated users can see bids

CREATE POLICY IF NOT EXISTS "feed_bids_insert" ON public.feed_bids
  FOR INSERT WITH CHECK (auth.uid() = bidder_id);

CREATE POLICY IF NOT EXISTS "feed_bids_update" ON public.feed_bids
  FOR UPDATE USING (
    auth.uid() = bidder_id   -- bidder can withdraw
    OR auth.uid() = (SELECT author_id FROM feed_posts WHERE id = post_id)  -- poster can accept/reject
  );
