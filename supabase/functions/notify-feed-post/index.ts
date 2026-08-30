/**
 * notify-feed-post
 * Triggered by: INSERT on feed_posts
 *
 * Fan-out push to all accepted friends/followers of the post author.
 * Uses the `friends` table (requester_id / addressee_id / status=accepted).
 *
 * Rate consideration: fan-out is capped at 200 recipients per post.
 * For large accounts consider moving to a queue — this is fine for MVP.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushBatch } from '../_shared/sendPush.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const POST_TYPE_LABELS: Record<string, string> = {
  update:           'posted an update',
  project_showcase: 'shared a new project',
  job_post:         'posted a job',
  milestone:        'hit a new milestone 🏆',
  parts_request:    'is looking for parts 🔩',
};

const FAN_OUT_LIMIT = 200;

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const post    = payload.record;

    if (!post?.id || !post?.author_id) return new Response('missing fields', { status: 400 });
    if (post.is_published === false)    return new Response('not published', { status: 200 });

    // 1. Load author name
    const { data: author } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', post.author_id)
      .single();

    const authorName = author?.full_name ?? 'Someone in your network';
    const verb       = POST_TYPE_LABELS[post.post_type] ?? 'posted something new';

    // 2. Find all accepted friends of the author
    const { data: friendships } = await supabase
      .from('friends')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${post.author_id},addressee_id.eq.${post.author_id}`)
      .limit(FAN_OUT_LIMIT);

    if (!friendships?.length) return new Response('no friends to notify', { status: 200 });

    // 3. Collect recipient IDs (everyone who is NOT the author)
    const recipientIds = friendships.map(f =>
      f.requester_id === post.author_id ? f.addressee_id : f.requester_id
    );

    // 4. Load push tokens for recipients who have notifications enabled
    const { data: profiles } = await supabase
      .from('profiles')
      .select('push_token, push_platform, push_enabled, allow_feed_notifications')
      .in('id', recipientIds)
      .eq('push_enabled', true)
      .eq('allow_feed_notifications', true);

    if (!profiles?.length) return new Response('no push-enabled recipients', { status: 200 });

    // 5. Fan out
    const preview = (post.content as string)?.slice(0, 80) ?? '';
    await sendPushBatch(profiles, {
      title: authorName,
      body:  `${verb}: "${preview}"`,
      data:  {
        ppf_type: 'new_feed_post',
        post_id:  post.id,
        post_type: post.post_type,
        author_id: post.author_id,
      },
    });

    return new Response(`notified ${profiles.length} recipients`, { status: 200 });
  } catch (err) {
    console.error('notify-feed-post error:', err);
    return new Response('error', { status: 500 });
  }
});
