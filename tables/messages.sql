create table public.messages (
  id uuid not null default gen_random_uuid (),
  conversation_id uuid null,
  sender_id uuid null,
  content text not null,
  attachments jsonb null,
  edited_at timestamp with time zone null,
  is_system_message boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint messages_pkey primary key (id),
  constraint messages_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_messages_conversation on public.messages using btree (conversation_id) TABLESPACE pg_default;

create index IF not exists idx_messages_sender on public.messages using btree (sender_id) TABLESPACE pg_default;

create index IF not exists idx_messages_created on public.messages using btree (created_at desc) TABLESPACE pg_default;

create trigger on_message_created
after INSERT on messages for EACH row
execute FUNCTION update_conversation_last_message ();