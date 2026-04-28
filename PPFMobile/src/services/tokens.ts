// Raw fetch — no supabase-js client (hangs in iOS simulator)
import { restGet, restRpc } from '../lib/restClient';

export interface TokenPurchase {
  id: string;
  user_id: string;
  tokens: number;
  stripe_payment_id: string | null;
  created_at: string;
}

export interface TokenPackage {
  id: string;
  tokens: number;
  price: number;      // USD cents
  label: string;
  popular?: boolean;
}

// Static packages — matches doc: Starter 10/$10, Pro 50/$45, Business 120/$99
export const TOKEN_PACKAGES: TokenPackage[] = [
  { id: 'starter',  tokens: 10,  price: 1000, label: 'Starter' },
  { id: 'pro',      tokens: 50,  price: 4500, label: 'Pro',      popular: true },
  { id: 'business', tokens: 120, price: 9900, label: 'Business' },
];

// ── Public API ────────────────────────────────────────────────────────────────

/** Fetch token_balance from profiles */
export async function fetchTokenBalance(userId: string, jwt: string): Promise<number> {
  const rows = await restGet<{ token_balance: number }[]>(
    `profiles?select=token_balance&id=eq.${userId}&limit=1`,
    jwt,
  );
  return rows[0]?.token_balance ?? 0;
}

/** Fetch purchase history, newest first */
export async function fetchPurchaseHistory(userId: string, jwt: string): Promise<TokenPurchase[]> {
  return restGet<TokenPurchase[]>(
    `token_purchases?select=id,user_id,tokens,stripe_payment_id,created_at&user_id=eq.${userId}&order=created_at.desc&limit=20`,
    jwt,
  );
}

/**
 * Credit tokens to a user's account via the add_tokens RPC.
 * Called after a successful Stripe payment (or directly in dev/test).
 */
export async function creditTokens(
  userId: string,
  tokens: number,
  stripePaymentId: string | null,
  jwt: string,
): Promise<void> {
  await restRpc<void>('add_tokens', {
    p_user_id:           userId,
    p_amount:            tokens,
    p_stripe_payment_id: stripePaymentId,
  }, jwt);
}
