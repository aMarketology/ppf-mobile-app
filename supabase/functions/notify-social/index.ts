/**
 * notify-social
 * Triggered by: INSERT or UPDATE on friends
 *
 * INSERT (status=pending)   → notify addressee: "<name> sent you a connection request"
 * UPDATE (status=accepted)  → notify requester: "<name> accepted your request"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPush } from '../_shared/sendPush.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function getProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('full_name, push_token, push_platform, push_enabled')
    .eq('id', userId)
    .single();
  return data;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const row     = payload.record;
    const oldRow  = payload.old_record;

    const isInsert    = !oldRow;
    const isAccepted  = !isInsert && oldRow.status !== 'accepted' && row.status === 'accepted';

    if (isInsert && row.status === 'pending') {
      // New connection request → notify addressee
      const [requester, addressee] = await Promise.all([
        getProfile(row.requester_id),
        getProfile(row.addressee_id),
      ]);
      if (!addressee?.push_token || addressee.push_enabled === false) {
        return new Response('push not enabled', { status: 200 });
      }
      await sendPush(addressee.push_token, addressee.push_platform!, {
        title: 'New Connection Request',
        body:  `${requester?.full_name ?? 'Someone'} wants to connect with you`,
        data:  { ppf_type: 'friend_request', user_id: row.requester_id },
      });

    } else if (isAccepted) {
      // Request accepted → notify the original requester
      const [requester, addressee] = await Promise.all([
        getProfile(row.requester_id),
        getProfile(row.addressee_id),
      ]);
      if (!requester?.push_token || requester.push_enabled === false) {
        return new Response('push not enabled', { status: 200 });
      }
      await sendPush(requester.push_token, requester.push_platform!, {
        title: 'Connection Accepted 🤝',
        body:  `${addressee?.full_name ?? 'Someone'} accepted your connection request`,
        data:  { ppf_type: 'friend_accepted', user_id: row.addressee_id },
      });
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('notify-social error:', err);
    return new Response('error', { status: 500 });
  }
});
