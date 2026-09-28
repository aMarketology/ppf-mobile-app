// All requests use raw fetch against the PostgREST/RPC REST API.
// Do NOT use the supabase-js client here — it hangs in the iOS simulator
// because it calls AsyncStorage internally.

import { restGet, restPost, restPatch, restRpc } from '../lib/restClient';
import { ENV } from '../config/env';

export interface Conv {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  conversation_type?: 'direct' | 'group' | 'channel';
  is_unlocked?: boolean;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  // computed
  unread_count?: number;
}

export interface Msg {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  message_type?: string;
  message_metadata?: Record<string, any> | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  created_at: string;
  // optimistic
  _temp?: boolean;
}

export interface UserResult {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchConversations(userId: string, jwt: string): Promise<Conv[]> {
  return restGet<Conv[]>(
    `user_conversations?select=id,participant_one_id,participant_two_id,last_message_at,created_at,updated_at&or=(participant_one_id.eq.${userId},participant_two_id.eq.${userId})&order=last_message_at.desc.nullslast`,
    jwt,
  );
}

export async function fetchMessages(conversationId: string, jwt: string): Promise<Msg[]> {
  return restGet<Msg[]>(
    `user_messages?select=id,conversation_id,sender_id,content,is_read,created_at&conversation_id=eq.${conversationId}&order=created_at.asc`,
    jwt,
  );
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  jwt: string,
): Promise<Msg> {
  const result = await restPost<Msg[]>(
    'user_messages?select=id,conversation_id,sender_id,content,is_read,created_at',
    { conversation_id: conversationId, sender_id: senderId, content },
    jwt,
  );
  return result[0];
}

export async function searchUsers(query: string, jwt: string): Promise<UserResult[]> {
  const encoded = encodeURIComponent(`%${query}%`);
  return restGet<UserResult[]>(
    `profiles?select=id,full_name,email&or=(full_name.ilike.${encoded},email.ilike.${encoded})&limit=10`,
    jwt,
  );
}

/** Fetch profile(s) by IDs — used to resolve conversation partner names */
export async function fetchProfiles(ids: string[], jwt: string): Promise<UserResult[]> {
  if (ids.length === 0) return [];
  const idList = ids.map(id => `"${id}"`).join(',');
  return restGet<UserResult[]>(
    `profiles?select=id,full_name,email&id=in.(${idList})`,
    jwt,
  );
}

export async function getOrCreateConversation(
  userOneId: string,
  userTwoId: string,
  jwt: string,
): Promise<Conv> {
  // RPC returns a plain UUID string, not a Conv object
  const convId = await restRpc<string>(
    'get_or_create_conversation',
    { user_one_id: userOneId, user_two_id: userTwoId },
    jwt,
  );
  // Strip quotes if wrapped (PostgREST returns quoted strings)
  const id = typeof convId === 'string' ? convId.replace(/"/g, '') : String(convId);
  // Fetch the full conversation object
  const convs = await restGet<Conv[]>(
    `user_conversations?select=id,participant_one_id,participant_two_id,last_message_at,created_at,updated_at&id=eq.${id}&limit=1`,
    jwt,
  );
  if (!convs[0]) throw new Error('Conversation not found');
  return convs[0];
}

// ── Real-time Subscription ───────────────────────────────────────────────────

/**
 * Subscribe to new messages in a conversation via Supabase Realtime WebSocket.
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(
  conversationId: string,
  jwt: string,
  onInsert: (msg: Msg) => void,
): () => void {
  const wsUrl = ENV.SUPABASE_URL
    .replace(/^https?:\/\//, 'wss://')
    .replace(/\/$/, '');

  const channelName = `conv_${conversationId}_${Date.now()}`;
  const ws = new WebSocket(
    `${wsUrl}/realtime/v1/websocket?apikey=${ENV.SUPABASE_ANON_KEY}&vsn=1.0.0`,
  );

  ws.onopen = () => {
    ws.send(JSON.stringify({
      topic: `realtime:public:user_messages:conv_id=eq.${conversationId}`,
      event: 'phx_join',
      payload: {
        config: {
          broadcast: { self: true },
          presence: { key: '' },
          postgres_changes: [{
            event: 'INSERT',
            schema: 'public',
            table: 'user_messages',
            filter: `conversation_id=eq.${conversationId}`,
          }],
        },
      },
      ref: channelName,
    }));

    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: channelName }));
      }
    }, 30_000);
    ws.addEventListener('close', () => clearInterval(heartbeat));
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.event === 'postgres_changes' && msg.payload) {
        const row = msg.payload.data?.record ?? msg.payload;
        if (!row || !row.id) return;

        onInsert({
          id: row.id,
          conversation_id: row.conversation_id,
          sender_id: row.sender_id,
          content: row.content,
          is_read: row.is_read ?? false,
          read_at: row.read_at ?? null,
          message_type: row.message_type,
          message_metadata: row.message_metadata ?? null,
          attachment_url: row.attachment_url ?? null,
          attachment_name: row.attachment_name ?? null,
          created_at: row.created_at ?? new Date().toISOString(),
        });
      }
    } catch { /* ignore malformed */ }
  };

  return () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.send(JSON.stringify({
        topic: `realtime:public:user_messages:conv_id=eq.${conversationId}`,
        event: 'phx_leave',
        payload: {},
        ref: channelName,
      }));
      ws.close();
    }
  };
}

// ── Unread Counts ────────────────────────────────────────────────────────────

export async function fetchUnreadCount(
  userId: string,
  conversationIds: string[],
  jwt: string,
): Promise<Record<string, number>> {
  if (conversationIds.length === 0) return {};

  const counts: Record<string, number> = {};
  // Fetch unread count per conversation in parallel using PostgREST count header
  await Promise.all(
    conversationIds.map(async (convId) => {
      try {
        const res = await fetch(
          `${ENV.SUPABASE_URL}/rest/v1/user_messages?select=id&conversation_id=eq.${convId}&sender_id=neq.${userId}&is_read=eq.false&limit=0`,
          {
            headers: {
              apikey: ENV.SUPABASE_ANON_KEY,
              Authorization: `Bearer ${jwt}`,
              Prefer: 'count=exact',
            },
          },
        );
        const total = parseInt(res.headers.get('content-range')?.split('/')[1] ?? '0', 10);
        counts[convId] = total;
      } catch {
        counts[convId] = 0;
      }
    }),
  );

  return counts;
}

// ── Mark as Read ─────────────────────────────────────────────────────────────

export async function markMessagesRead(
  conversationId: string,
  userId: string,
  jwt: string,
): Promise<void> {
  await restPatch(
    `user_messages?conversation_id=eq.${conversationId}&sender_id=neq.${userId}&is_read=eq.false`,
    { is_read: true, read_at: new Date().toISOString() },
    jwt,
  );
}

// ── Typing Indicator (Broadcast) ─────────────────────────────────────────────

export function broadcastTyping(
  conversationId: string,
  userId: string,
  isTyping: boolean,
): void {
  const wsUrl = ENV.SUPABASE_URL
    .replace(/^https?:\/\//, 'wss://')
    .replace(/\/$/, '');

  const ws = new WebSocket(
    `${wsUrl}/realtime/v1/websocket?apikey=${ENV.SUPABASE_ANON_KEY}&vsn=1.0.0`,
  );

  ws.onopen = () => {
    ws.send(JSON.stringify({
      topic: `realtime:public:user_messages:conv_id=eq.${conversationId}`,
      event: 'broadcast',
      payload: { event: 'typing', payload: { user_id: userId, is_typing: isTyping } },
      ref: `typing_${conversationId}_${Date.now()}`,
    }));
    ws.close();
  };
}

// ── Token-Gated Unlock ───────────────────────────────────────────────────────

export async function unlockConversation(
  conversationId: string,
  jwt: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await restRpc('spend_tokens', {
      p_conversation_id: conversationId,
      p_amount: 100,
      p_description: 'Unlock direct message conversation',
    }, jwt);
    // Mark conversation as unlocked
    await restPatch(
      `user_conversations?id=eq.${conversationId}`,
      { is_unlocked: true },
      jwt,
    );
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Failed to unlock conversation' };
  }
}

// ── Token-Gated Conversation Creation ────────────────────────────────────────

/**
 * Create or find a DM conversation with another user.
 * If a new conversation is created, 75 tokens are deducted via spend_tokens RPC.
 * Returns the conversation ID and whether tokens were charged.
 */
export async function createConversation(
  jwt: string,
  otherUserId: string,
): Promise<{ conversation_id: string; charged: boolean }> {
  // 1. Get or create the conversation
  const convId = await restRpc<string>(
    'get_or_create_conversation',
    { user_one_id: otherUserId, user_two_id: otherUserId },
    jwt,
  );
  const id = typeof convId === 'string' ? convId.replace(/"/g, '') : String(convId);

  // 2. Check if this is a new conversation (no messages yet)
  const msgs = await restGet<any[]>(
    `user_messages?select=id&conversation_id=eq.${id}&limit=1`,
    jwt,
  );

  const isNew = msgs.length === 0;

  // 3. If new, deduct 75 tokens
  if (isNew) {
    const result = await restRpc<any>('spend_tokens', {
      p_user_id: otherUserId,
      p_amount: 75,
      p_description: 'New direct message conversation',
      p_reference_id: id,
    }, jwt);

    if (result === 'insufficient_tokens') {
      throw new Error('Insufficient tokens. You need 75 tokens to start a new conversation.');
    }
  }

  return { conversation_id: id, charged: isNew };
}
