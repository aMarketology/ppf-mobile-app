create table public.message_mentions (
  id uuid not null default gen_random_uuid (),
  message_id uuid not null,
  conversation_id uuid not null,
  mentioned_user_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint message_mentions_pkey primary key (id),
  constraint message_mentions_message_id_mentioned_user_id_key unique (message_id, mentioned_user_id),
  constraint message_mentions_conversation_id_fkey foreign KEY (conversation_id) references user_conversations (id) on delete CASCADE,
  constraint message_mentions_mentioned_user_id_fkey foreign KEY (mentioned_user_id) references auth.users (id) on delete CASCADE,
  constraint message_mentions_message_id_fkey foreign KEY (message_id) references user_messages (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_mm_user on public.message_mentions using btree (mentioned_user_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_mm_conversation on public.message_mentions using btree (conversation_id) TABLESPACE pg_default;