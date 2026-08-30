create table public.friends (
  id uuid not null default extensions.uuid_generate_v4 (),
  requester_id uuid not null,
  addressee_id uuid not null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  constraint friends_pkey primary key (id),
  constraint friends_requester_id_addressee_id_key unique (requester_id, addressee_id),
  constraint friends_addressee_id_fkey foreign KEY (addressee_id) references profiles (id) on delete CASCADE,
  constraint friends_requester_id_fkey foreign KEY (requester_id) references profiles (id) on delete CASCADE,
  constraint friends_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'accepted'::text,
          'declined'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_friends_requester on public.friends using btree (requester_id) TABLESPACE pg_default;

create index IF not exists idx_friends_addressee on public.friends using btree (addressee_id) TABLESPACE pg_default;