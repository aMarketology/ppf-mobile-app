-- ─────────────────────────────────────────────────────────────────────────────
-- add_tokens RPC — called by the stripe-webhook edge function after
-- payment_intent.succeeded to credit tokens to a user and log the purchase.
--
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Ensure token_purchases table exists
CREATE TABLE IF NOT EXISTS public.token_purchases (
  id                  UUID           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens              INTEGER        NOT NULL CHECK (tokens > 0),
  stripe_payment_id   TEXT           NOT NULL UNIQUE,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- Index for profile history queries
CREATE INDEX IF NOT EXISTS idx_token_purchases_user
  ON public.token_purchases (user_id, created_at DESC);

-- RLS
ALTER TABLE public.token_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "token_purchases_select_own"
  ON public.token_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Service role bypass — the edge function uses the service role key
-- so it bypasses RLS automatically. No extra policy needed for writes.


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. add_tokens RPC
--    Called with: p_user_id UUID, p_amount INTEGER, p_stripe_payment_id TEXT
--    Returns:     VOID
--
--    SECURITY DEFINER so it can bypass RLS on both tables.
--    Idempotent: duplicate stripe_payment_id is silently ignored (ON CONFLICT).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.add_tokens(
  p_user_id           UUID,
  p_amount            INTEGER,
  p_stripe_payment_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Idempotency: if this PaymentIntent was already processed, do nothing.
  INSERT INTO public.token_purchases (user_id, tokens, stripe_payment_id)
  VALUES (p_user_id, p_amount, p_stripe_payment_id)
  ON CONFLICT (stripe_payment_id) DO NOTHING;

  -- Only update the balance if the row was actually inserted (i.e. not a dupe)
  IF FOUND THEN
    UPDATE public.profiles
    SET token_balance = token_balance + p_amount,
        updated_at    = now()
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- Grant execute only to the service role (edge function).
-- Authenticated users do NOT get execute — they can't mint their own tokens.
REVOKE EXECUTE ON FUNCTION public.add_tokens(UUID, INTEGER, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_tokens(UUID, INTEGER, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.add_tokens(UUID, INTEGER, TEXT) TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. saved_products table (required by notify-marketplace edge function)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.saved_products (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_products_user
  ON public.saved_products (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_products_product
  ON public.saved_products (product_id);

ALTER TABLE public.saved_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "saved_products_select_own" ON public.saved_products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "saved_products_insert_own" ON public.saved_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "saved_products_delete_own" ON public.saved_products
  FOR DELETE USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Ensure profiles has token_balance column (should already exist)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS token_balance INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT now();
