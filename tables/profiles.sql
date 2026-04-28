create table public.profiles (
  id uuid not null,
  email text not null,
  full_name text null,
  user_type text null,
  bio text null,
  location text null,
  created_at timestamp with time zone null default now(),
  avatar_url text null,
  updated_at timestamp with time zone null default now(),
  token_balance integer not null default 0,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_user_type_check check (
    (
      user_type = any (array['client'::text, 'engineer'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_profiles_user_type on public.profiles using btree (user_type) TABLESPACE pg_default;

create index IF not exists idx_profiles_email on public.profiles using btree (email) TABLESPACE pg_default;

create trigger profiles_set_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION set_updated_at ();