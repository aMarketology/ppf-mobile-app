create table public.user_conversations (
  id uuid not null default gen_random_uuid (),
  participant_one_id uuid null,
  participant_two_id uuid null,
  last_message_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_unlocked boolean not null default false,
  conversation_type text not null default 'direct'::text,
  name text null,
  description text null,
  is_public boolean not null default false,
  company_id uuid null,
  created_by uuid null,
  constraint user_conversations_pkey primary key (id),
  constraint unique_conversation unique (participant_one_id, participant_two_id),
  constraint user_conversations_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint user_conversations_participant_one_id_fkey foreign KEY (participant_one_id) references auth.users (id) on delete CASCADE,
  constraint user_conversations_participant_two_id_fkey foreign KEY (participant_two_id) references auth.users (id) on delete CASCADE,
  constraint different_participants check ((participant_one_id <> participant_two_id))
) TABLESPACE pg_default;

create index IF not exists idx_user_conversations_participant_one on public.user_conversations using btree (participant_one_id) TABLESPACE pg_default;

create index IF not exists idx_user_conversations_participant_two on public.user_conversations using btree (participant_two_id) TABLESPACE pg_default;

create index IF not exists idx_user_conversations_last_message on public.user_conversations using btree (last_message_at desc) TABLESPACE pg_default;

create index IF not exists idx_conversations_p1 on public.user_conversations using btree (participant_one_id) TABLESPACE pg_default;

create index IF not exists idx_conversations_p2 on public.user_conversations using btree (participant_two_id) TABLESPACE pg_default;

create unique INDEX IF not exists idx_unique_conversation_pair on public.user_conversations using btree (
  LEAST(
    (participant_one_id)::text,
    (participant_two_id)::text
  ),
  GREATEST(
    (participant_one_id)::text,
    (participant_two_id)::text
  )
) TABLESPACE pg_default;

create index IF not exists idx_user_conversations_p1 on public.user_conversations using btree (participant_one_id) TABLESPACE pg_default;

create index IF not exists idx_user_conversations_p2 on public.user_conversations using btree (participant_two_id) TABLESPACE pg_default;

create index IF not exists idx_user_conversations_last_msg on public.user_conversations using btree (last_message_at desc) TABLESPACE pg_default;

create trigger update_user_conversations_timestamp BEFORE
update on user_conversations for EACH row
execute FUNCTION update_user_conversations_timestamp ();