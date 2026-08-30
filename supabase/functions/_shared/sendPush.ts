/**
 * sendPush.ts — Unified push dispatcher.
 * Routes to APNs (iOS) or FCM (Android) based on the profile's push_platform.
 * Import this in every notify-* edge function — never call apns/fcm directly.
 */

import { sendApns, type ApnsPayload } from './apns.ts';
import { sendFcm,  type FcmPayload  } from './fcm.ts';

export interface PushPayload {
  title:    string;
  body:     string;
  badge?:   number;
  data?:    Record<string, string>;   // must include ppf_type
  category?: string;                  // iOS only — for actionable notifications
}

/**
 * Send a push notification to one user.
 * @param token     - raw APNs token (iOS) or FCM registration token (Android)
 * @param platform  - 'ios' | 'android'
 * @param payload   - notification content + deep-link data
 */
export async function sendPush(
  token:    string,
  platform: string,
  payload:  PushPayload,
): Promise<void> {
  if (!token) return; // user hasn't granted permission / registered token

  if (platform === 'ios') {
    const apnsPayload: ApnsPayload = {
      title:    payload.title,
      body:     payload.body,
      data:     payload.data,
      badge:    payload.badge,
      category: payload.category,
    };
    await sendApns(token, apnsPayload);
  } else if (platform === 'android') {
    const fcmPayload: FcmPayload = {
      title: payload.title,
      body:  payload.body,
      data:  payload.data,
    };
    await sendFcm(token, fcmPayload);
  } else {
    console.warn(`sendPush: unknown platform "${platform}" for token ${token.slice(0, 8)}…`);
  }
}

/**
 * Send push to multiple users at once (fan-out).
 * Errors for individual tokens are logged but don't fail the batch.
 */
export async function sendPushBatch(
  recipients: Array<{ push_token: string | null; push_platform: string | null }>,
  payload: PushPayload,
): Promise<void> {
  await Promise.allSettled(
    recipients
      .filter(r => r.push_token && r.push_platform)
      .map(r =>
        sendPush(r.push_token!, r.push_platform!, payload).catch(err =>
          console.error(`sendPush failed for token ${r.push_token?.slice(0, 8)}…:`, err.message),
        ),
      ),
  );
}
