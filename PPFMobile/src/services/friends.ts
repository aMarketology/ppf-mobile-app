// Friends service — raw fetch against Supabase PostgREST
import type { Friend, FriendStatus } from '../lib/types';
import { restGet, restPost, restPatch, restRpc } from '../lib/restClient';

// ── Public API ────────────────────────────────────────────────────────────────

/** Fetch all friend connections for a user (sent + received) */
export async function fetchFriends(userId: string, jwt: string): Promise<Friend[]> {
  return restGet<Friend[]>(
    `friends?select=id,requester_id,addressee_id,status,created_at&or=(requester_id.eq.${userId},addressee_id.eq.${userId})&order=created_at.desc`,
    jwt,
  );
}

/** Fetch accepted friends only */
export async function fetchAcceptedFriends(userId: string, jwt: string): Promise<Friend[]> {
  return restGet<Friend[]>(
    `friends?select=id,requester_id,addressee_id,status,created_at&status=eq.accepted&or=(requester_id.eq.${userId},addressee_id.eq.${userId})&order=created_at.desc`,
    jwt,
  );
}

/** Fetch pending friend requests received by the user */
export async function fetchPendingRequests(userId: string, jwt: string): Promise<Friend[]> {
  return restGet<Friend[]>(
    `friends?select=id,requester_id,addressee_id,status,created_at&status=eq.pending&addressee_id=eq.${userId}&order=created_at.desc`,
    jwt,
  );
}

/** Send a friend request */
export async function sendFriendRequest(requesterId: string, addresseeId: string, jwt: string): Promise<Friend> {
  const result = await restPost<Friend[]>(
    'friends?select=id,requester_id,addressee_id,status,created_at',
    { requester_id: requesterId, addressee_id: addresseeId, status: 'pending' },
    jwt,
  );
  return result[0];
}

/** Accept or decline a friend request */
export async function respondToRequest(friendId: string, status: 'accepted' | 'declined', jwt: string): Promise<Friend> {
  const result = await restPatch<Friend[]>(
    `friends?id=eq.${friendId}&select=id,requester_id,addressee_id,status,created_at`,
    { status },
    jwt,
  );
  return result[0];
}

/** Check if two users are friends via RPC */
export async function areFriends(userA: string, userB: string, jwt: string): Promise<boolean> {
  return restRpc<boolean>('are_friends', { user_a: userA, user_b: userB }, jwt);
}
