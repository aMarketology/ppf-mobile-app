/**
 * notify-marketplace
 * Triggered by: UPDATE on products (specifically is_active or price changes)
 *
 * Use cases:
 *   - A product goes live (is_active: false → true) → notify users who saved it
 *   - Price drops → notify saved users
 *
 * Requires a `saved_products` table:
 *   saved_products(id, user_id, product_id, created_at)
 *   (create if it doesn't exist — SQL in tables/feed_migration.sql)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushBatch } from '../_shared/sendPush.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const FAN_OUT_LIMIT = 100;

Deno.serve(async (req) => {
  try {
    const payload  = await req.json();
    const product  = payload.record;
    const oldProduct = payload.old_record;

    if (!product?.id) return new Response('missing product', { status: 400 });

    // Determine what changed
    const justActivated = !oldProduct?.is_active && product.is_active;
    const priceDropped  = product.is_active &&
                          oldProduct?.price != null &&
                          product.price < oldProduct.price;

    if (!justActivated && !priceDropped) {
      return new Response('no relevant change', { status: 200 });
    }

    // Find users who saved this product
    const { data: saved } = await supabase
      .from('saved_products')
      .select('user_id')
      .eq('product_id', product.id)
      .limit(FAN_OUT_LIMIT);

    if (!saved?.length) return new Response('no saved users', { status: 200 });

    const userIds = saved.map((s: { user_id: string }) => s.user_id);

    // Load push tokens
    const { data: profiles } = await supabase
      .from('profiles')
      .select('push_token, push_platform, push_enabled')
      .in('id', userIds)
      .eq('push_enabled', true);

    if (!profiles?.length) return new Response('no push-enabled users', { status: 200 });

    // Build notification
    const productName = product.name ?? 'A product you saved';
    let title: string;
    let body: string;

    if (justActivated) {
      title = '🏪 Product Now Available';
      body  = `"${productName}" is now live on the marketplace`;
    } else {
      const oldPrice  = ((oldProduct.price ?? 0) / 100).toFixed(2);
      const newPrice  = ((product.price ?? 0) / 100).toFixed(2);
      title = '💰 Price Drop Alert';
      body  = `"${productName}" dropped from $${oldPrice} → $${newPrice}`;
    }

    await sendPushBatch(profiles, {
      title,
      body,
      data: {
        ppf_type:   'marketplace_update',
        product_id: product.id,
      },
    });

    return new Response(`notified ${profiles.length} users`, { status: 200 });
  } catch (err) {
    console.error('notify-marketplace error:', err);
    return new Response('error', { status: 500 });
  }
});
