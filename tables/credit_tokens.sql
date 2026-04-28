-- ─────────────────────────────────────────────────────────────────────────────
-- credit_tokens
--
-- Atomically inserts a token_purchases record and increments the user's
-- token_balance in profiles. Returns the new balance.
--
-- In production, call this from a Stripe webhook Edge Function (not the client).
-- For development/testing it can be called directly.
--
-- Usage:
--   SELECT credit_tokens(
--     'user-uuid',
--     25,
--     'pi_stripe_payment_intent_id'   -- or NULL for manual/test credits
--   );
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION credit_tokens(
  p_user_id           uuid,
  p_tokens            integer,
  p_stripe_payment_id text DEFAULT NULL
)
RETURNS integer        -- returns new balance
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_balance integer;
BEGIN
  -- Record the purchase
  INSERT INTO public.token_purchases (user_id, tokens, stripe_payment_id)
  VALUES (p_user_id, p_tokens, p_stripe_payment_id);

  -- Credit the balance
  UPDATE public.profiles
  SET token_balance = token_balance + p_tokens
  WHERE id = p_user_id
  RETURNING token_balance INTO new_balance;

  RETURN new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION credit_tokens(uuid, integer, text) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS for token_purchases
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.token_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tp_select" ON public.token_purchases;
DROP POLICY IF EXISTS "tp_insert" ON public.token_purchases;

-- Users can only see their own purchases
CREATE POLICY "tp_select" ON public.token_purchases
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Only the SECURITY DEFINER function above inserts rows,
-- but allow direct insert as fallback (same user only)
CREATE POLICY "tp_insert" ON public.token_purchases
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS for profiles (token_balance update)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);   -- any authenticated user can read any profile (for search)

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
