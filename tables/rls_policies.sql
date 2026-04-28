-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies for messages + conversations
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enable RLS (in case it isn't already) ────────────────────────────────────
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- ── Drop existing policies so we start clean ─────────────────────────────────
DROP POLICY IF EXISTS "messages_select"  ON public.messages;
DROP POLICY IF EXISTS "messages_insert"  ON public.messages;
DROP POLICY IF EXISTS "convs_select"     ON public.conversations;
DROP POLICY IF EXISTS "convs_insert"     ON public.conversations;
DROP POLICY IF EXISTS "convs_update"     ON public.conversations;

-- ── messages: SELECT ─────────────────────────────────────────────────────────
-- A user can read messages in a conversation they created OR are named in the dm key
-- NOTE: No self-reference to messages table to avoid infinite recursion (42P17)
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.created_by = auth.uid()
          OR c.subject LIKE '%' || auth.uid()::text || '%'
        )
    )
  );

-- ── messages: INSERT ─────────────────────────────────────────────────────────
-- A user can send a message as themselves if they created the conversation
-- OR their UUID appears in the dm key (covers both sides of a DM)
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.created_by = auth.uid()
          OR c.subject LIKE '%' || auth.uid()::text || '%'
        )
    )
  );

-- ── conversations: SELECT ─────────────────────────────────────────────────────
-- A user can see conversations they created OR are named in the dm key
-- NOTE: No cross-reference to messages table to avoid infinite recursion (42P17)
CREATE POLICY "convs_select" ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR subject LIKE '%' || auth.uid()::text || '%'
  );

-- ── conversations: INSERT ─────────────────────────────────────────────────────
-- Only the get_or_create_conversation function (SECURITY DEFINER) inserts rows,
-- but add this as a fallback so authenticated users can also create directly
CREATE POLICY "convs_insert" ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- ── conversations: UPDATE ─────────────────────────────────────────────────────
-- Allow updating last_message_at (triggered by the on_message_created trigger)
CREATE POLICY "convs_update" ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR subject LIKE '%' || auth.uid()::text || '%'
  );
