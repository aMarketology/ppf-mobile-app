-- ─────────────────────────────────────────────────────────────────────────────
-- get_or_create_conversation
--
-- Finds an existing conversation between two users OR creates a new one.
-- Works by looking for conversations where both users have participated
-- (one as created_by, other as a participant in messages — simplified here
-- to just check created_by since we removed conversation_participants).
--
-- Usage:
--   SELECT * FROM get_or_create_conversation(
--     'uuid-of-user-a',
--     'uuid-of-user-b'
--   );
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user_one_id uuid,
  user_two_id uuid
)
RETURNS TABLE (
  id              uuid,
  subject         text,
  status          text,
  created_at      timestamptz,
  last_message_at timestamptz,
  company_id      uuid,
  created_by      uuid,
  is_new          boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_id uuid;
BEGIN
  -- Look for a conversation created by user_one that user_two has sent a message in,
  -- OR created by user_two that user_one has sent a message in.
  SELECT c.id INTO existing_id
  FROM conversations c
  WHERE
    (
      c.created_by = user_one_id
      AND EXISTS (
        SELECT 1 FROM messages m
        WHERE m.conversation_id = c.id
          AND m.sender_id = user_two_id
      )
    )
    OR
    (
      c.created_by = user_two_id
      AND EXISTS (
        SELECT 1 FROM messages m
        WHERE m.conversation_id = c.id
          AND m.sender_id = user_one_id
      )
    )
    OR
    -- Also match if user_two created it and user_one has no messages yet (fresh start)
    (
      c.created_by = user_two_id
      AND c.company_id IS NULL
      AND (
        SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id
      ) = 0
    )
  ORDER BY c.created_at DESC
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    -- Return existing conversation
    RETURN QUERY
      SELECT c.id, c.subject, c.status::text, c.created_at, c.last_message_at,
             c.company_id, c.created_by, false AS is_new
      FROM conversations c
      WHERE c.id = existing_id;
  ELSE
    -- Create a new direct conversation
    RETURN QUERY
      INSERT INTO conversations (created_by, subject, status)
      VALUES (
        user_one_id,
        NULL,   -- no subject for direct DMs; set by first message
        'active'
      )
      RETURNING
        conversations.id,
        conversations.subject,
        conversations.status::text,
        conversations.created_at,
        conversations.last_message_at,
        conversations.company_id,
        conversations.created_by,
        true AS is_new;
  END IF;
END;
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION get_or_create_conversation(uuid, uuid) TO authenticated;
