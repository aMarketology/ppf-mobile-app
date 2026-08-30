/**
 * notify-order-status
 * Triggered by: INSERT or UPDATE on orders
 *
 * On INSERT  → notify the engineer: "New order from <client_name>"
 * On UPDATE  → notify both parties with status-specific messages:
 *   pending   → engineer: "You have a new order"
 *   active    → client:   "Your order has been accepted"
 *   completed → client:   "Your order is complete"
 *   cancelled → other party: "Order was cancelled"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPush } from '../_shared/sendPush.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const STATUS_MESSAGES: Record<string, { toClient?: string; toEngineer?: string }> = {
  pending:   { toEngineer: 'You have a new order waiting for you' },
  active:    { toClient:   'Your order has been accepted and is now active' },
  completed: { toClient:   'Your order has been marked as complete 🎉' },
  cancelled: { toClient:   'Your order has been cancelled', toEngineer: 'An order was cancelled' },
};

async function notifyUser(userId: string, title: string, body: string, orderId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token, push_platform, push_enabled')
    .eq('id', userId)
    .single();

  if (!profile?.push_token || !profile?.push_platform || profile.push_enabled === false) return;

  await sendPush(profile.push_token, profile.push_platform, {
    title,
    body,
    data: { ppf_type: 'order_status', order_id: orderId },
  });
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const order   = payload.record;
    const oldRow  = payload.old_record; // null on INSERT

    if (!order?.id) return new Response('missing order', { status: 400 });

    const status: string = order.status ?? 'pending';
    const msgs = STATUS_MESSAGES[status];
    if (!msgs) return new Response('no message for status', { status: 200 });

    // Load names for friendly notification titles
    const userIds = [order.client_id, order.engineer_id].filter(Boolean);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    const nameMap: Record<string, string> = {};
    for (const p of profiles ?? []) nameMap[p.id] = p.full_name ?? 'Someone';

    const isInsert = !oldRow;
    const statusChanged = isInsert || oldRow.status !== order.status;
    if (!statusChanged) return new Response('no status change', { status: 200 });

    const promises: Promise<void>[] = [];

    if (msgs.toClient && order.client_id) {
      promises.push(notifyUser(
        order.client_id,
        'PPF Order Update',
        msgs.toClient,
        order.id,
      ));
    }

    if (msgs.toEngineer && order.engineer_id) {
      const clientName = nameMap[order.client_id] ?? 'A client';
      promises.push(notifyUser(
        order.engineer_id,
        clientName,
        msgs.toEngineer,
        order.id,
      ));
    }

    await Promise.allSettled(promises);
    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('notify-order-status error:', err);
    return new Response('error', { status: 500 });
  }
});
