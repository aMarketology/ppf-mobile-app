/**
 * notify-account
 * Triggered by: UPDATE on profiles
 *
 * Sends a push when a user's token_balance drops to a low threshold.
 * Rate-limited: only once per 24h via last_low_token_notified_at column.
 *
 * Thresholds:
 *   ≤ 2 tokens  → "Critical: you're almost out of tokens"
 *   ≤ 5 tokens  → "Low balance: only X tokens remaining"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPush } from '../_shared/sendPush.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const LOW_THRESHOLD      = 5;
const CRITICAL_THRESHOLD = 2;
const COOLDOWN_HOURS     = 24;

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const profile = payload.record;
    const oldProfile = payload.old_record;

    // Only care about token_balance changes
    if (!profile?.id || profile.token_balance === oldProfile?.token_balance) {
      return new Response('no balance change', { status: 200 });
    }

    const balance: number = profile.token_balance ?? 0;

    // Only fire on balance DROP into low range (not on purchase top-ups)
    if (balance > LOW_THRESHOLD) return new Response('balance ok', { status: 200 });
    if (profile.push_enabled === false) return new Response('push disabled', { status: 200 });
    if (!profile.push_token || !profile.push_platform) return new Response('no token', { status: 200 });

    // Rate-limit: skip if already notified within COOLDOWN_HOURS
    if (profile.last_low_token_notified_at) {
      const lastNotified = new Date(profile.last_low_token_notified_at).getTime();
      const hoursSince   = (Date.now() - lastNotified) / 3_600_000;
      if (hoursSince < COOLDOWN_HOURS) return new Response('rate limited', { status: 200 });
    }

    const isCritical = balance <= CRITICAL_THRESHOLD;
    const title = isCritical ? '⚠️ Token Balance Critical' : '🪙 Low Token Balance';
    const body  = isCritical
      ? `You only have ${balance} token${balance === 1 ? '' : 's'} left — top up now to keep messaging`
      : `You have ${balance} tokens remaining — consider purchasing more`;

    await sendPush(profile.push_token, profile.push_platform, {
      title,
      body,
      data: { ppf_type: 'low_token_balance', balance: String(balance) },
    });

    // Update the rate-limit timestamp
    await supabase
      .from('profiles')
      .update({ last_low_token_notified_at: new Date().toISOString() })
      .eq('id', profile.id);

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('notify-account error:', err);
    return new Response('error', { status: 500 });
  }
});
