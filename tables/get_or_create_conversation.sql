-- ─────────────────────────────────────────────────────────────────────────────
-- get_or_create_conversation
--
-- Finds an existing direct-message conversation between two users OR creates
-- a new one.  DM conversations are identified by a canonical subject key:
--   dm:<smaller-uuid>:<larger-uuid>
-- This is stored in the `subject` column so no schema changes are needed.
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
  dm_key      text;
  existing_id uuid;
BEGIN
  -- Build a stable, order-independent key from the two UUIDs
  IF user_one_id::text < user_two_id::text THEN
    dm_key := 'dm:' || user_one_id::text || ':' || user_two_id::text;
  ELSE
    dm_key := 'dm:' || user_two_id::text || ':' || user_one_id::text;
  END IF;

  -- Try to find an existing conversation with this key
  SELECT c.id INTO existing_id
  FROM conversations c
  WHERE c.subject = dm_key
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    -- Return existing
    RETURN QUERY
      SELECT c.id, c.subject, c.status::text, c.created_at, c.last_message_at,
             c.company_id, c.created_by, false AS is_new
      FROM conversations c
      WHERE c.id = existing_id;
  ELSE
    -- Create new DM conversation
    RETURN QUERY
      INSERT INTO conversations (created_by, subject, status)
      VALUES (user_one_id, dm_key, 'active')
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

