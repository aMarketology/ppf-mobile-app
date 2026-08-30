create table public.conversation_participants (
  id uuid not null default gen_random_uuid (),
  conversation_id uuid not null,
  user_id uuid not null,
  role text not null default 'member'::text,
  joined_at timestamp with time zone not null default now(),
  constraint conversation_participants_pkey primary key (id),
  constraint conversation_participants_conversation_id_user_id_key unique (conversation_id, user_id),
  constraint conversation_participants_conversation_id_fkey foreign KEY (conversation_id) references user_conversations (id) on delete CASCADE,
  constraint conversation_participants_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_cp_user on public.conversation_participants using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_cp_conv on public.conversation_participants using btree (conversation_id) TABLESPACE pg_default;