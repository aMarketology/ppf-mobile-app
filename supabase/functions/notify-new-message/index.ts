/**
 * notify-new-message
 * Triggered by a Supabase Database Webhook on:  INSERT on user_messages (or messages)
 *
 * Payload shape (Supabase webhook):
 *   { type: "INSERT", table: "messages", record: { id, conversation_id, sender_id, content, ... } }
 *
 * Logic:
 *   1. Load the conversation → find participant_one_id / participant_two_id
 *   2. The recipient = the participant that is NOT the sender
 *   3. Load recipient profile → push_token, push_platform, push_enabled
 *   4. Load sender profile → full_name for notification body
 *   5. sendPush()
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPush } from '../_shared/sendPush.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const msg = payload.record;

    if (!msg?.conversation_id || !msg?.sender_id) {
      return new Response('missing fields', { status: 400 });
    }

    // 1. Find conversation participants
    const { data: conv, error: convErr } = await supabase
      .from('user_conversations')
      .select('participant_one_id, participant_two_id')
      .eq('id', msg.conversation_id)
      .single();

    if (convErr || !conv) {
      console.error('conv lookup failed:', convErr?.message);
      return new Response('conv not found', { status: 404 });
    }

    const recipientId =
      conv.participant_one_id === msg.sender_id
        ? conv.participant_two_id
        : conv.participant_one_id;

    // 2. Load recipient push settings
    const { data: recipient } = await supabase
      .from('profiles')
      .select('push_token, push_platform, push_enabled, full_name')
      .eq('id', recipientId)
      .single();

    if (!recipient?.push_token || !recipient?.push_platform || recipient.push_enabled === false) {
      return new Response('push not enabled', { status: 200 });
    }

    // 3. Load sender name
    const { data: sender } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', msg.sender_id)
      .single();

    const senderName = sender?.full_name ?? 'Someone';
    const preview = (msg.content as string)?.slice(0, 80) ?? 'New message';

    await sendPush(recipient.push_token, recipient.push_platform, {
      title: senderName,
      body:  preview,
      data:  {
        ppf_type:        'new_message',
        conversation_id: msg.conversation_id,
        sender_id:       msg.sender_id,
      },
    });

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('notify-new-message error:', err);
    return new Response('error', { status: 500 });
  }
});
