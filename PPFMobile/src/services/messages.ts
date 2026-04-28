// All requests use raw fetch against the PostgREST/RPC REST API.
// Do NOT use the supabase-js client here — it hangs in the iOS simulator
// because it calls AsyncStorage internally.

import { restGet, restPost, restRpc } from '../lib/restClient';

export interface Conv {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Msg {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface UserResult {
  id: string;
  full_name: string | null;
  email: string;
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
