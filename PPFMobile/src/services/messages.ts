// All requests use raw fetch against the PostgREST/RPC REST API.
// Do NOT use the supabase-js client here — it hangs in the iOS simulator
// because it calls AsyncStorage internally.

const SUPABASE_URL = 'https://ifrxzmemiihxfdimwvcw.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlmcnh6bWVtaWloeGZkaW13dmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzYzNDEsImV4cCI6MjA4NzY1MjM0MX0.2_xxH2XZyNrLaRIQBMr2Fr2upn-3CKZuUTf1SVgojvc';

export interface Conv {
  id: string;
  subject: string | null;
  status: string | null;
  created_at: string;
  last_message_at: string | null;
  company_id: string | null;
  created_by?: string | null;
}

export interface Msg {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface UserResult {
  id: string;
  full_name: string | null;
  email: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function restGet<T>(path: string, jwt: string): Promise<T> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      signal: ctrl.signal,
      headers: {
        apikey:        ANON_KEY,
        Authorization: `Bearer ${jwt}`,
        Accept:        'application/json',
      },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function restPost<T>(path: string, jwt: string, body: unknown): Promise<T> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method:  'POST',
      signal:  ctrl.signal,
      headers: {
        apikey:         ANON_KEY,
        Authorization:  `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        Accept:         'application/json',
        Prefer:         'return=representation',
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function rpcPost<T>(fn: string, jwt: string, params: unknown): Promise<T> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method:  'POST',
      signal:  ctrl.signal,
      headers: {
        apikey:         ANON_KEY,
        Authorization:  `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
      body: JSON.stringify(params),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchConversations(userId: string, jwt: string): Promise<Conv[]> {
  return restGet<Conv[]>(
    `conversations?select=id,subject,status,created_at,last_message_at,company_id,created_by&created_by=eq.${userId}&order=created_at.desc`,
    jwt,
  );
}

export async function fetchMessages(conversationId: string, jwt: string): Promise<Msg[]> {
  return restGet<Msg[]>(
    `messages?select=id,conversation_id,sender_id,content,created_at&conversation_id=eq.${conversationId}&order=created_at.asc`,
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
    'messages?select=id,conversation_id,sender_id,content,created_at',
    jwt,
    { conversation_id: conversationId, sender_id: senderId, content },
  );
  return result[0];
}

export async function searchUsers(query: string, jwt: string): Promise<UserResult[]> {
  const encoded = encodeURIComponent(`%${query}%`);
  return restGet<UserResult[]>(
    `profiles?select=id,full_name,email&full_name=ilike.${encoded}&limit=10`,
    jwt,
  );
}

export async function getOrCreateConversation(
  userOneId: string,
  userTwoId: string,
  jwt: string,
): Promise<Conv> {
  const result = await rpcPost<Conv[]>(
    'get_or_create_conversation',
    jwt,
    { user_one_id: userOneId, user_two_id: userTwoId },
  );
  return result[0];
}
