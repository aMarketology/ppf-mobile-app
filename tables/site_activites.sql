create table public.site_activities (
  id uuid not null default gen_random_uuid (),
  activity_type text not null,
  actor_id uuid null,
  target_type text null,
  target_id uuid null,
  summary text not null,
  metadata jsonb null default '{}'::jsonb,
  previous_hash text null,
  row_hash text not null,
  created_at timestamp with time zone not null default now(),
  constraint site_activities_pkey primary key (id),
  constraint site_activities_actor_id_fkey foreign KEY (actor_id) references auth.users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_sa_created on public.site_activities using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_sa_type on public.site_activities using btree (activity_type, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_sa_actor on public.site_activities using btree (actor_id) TABLESPACE pg_default;

create index IF not exists idx_sa_target on public.site_activities using btree (target_type, target_id) TABLESPACE pg_default;

create index IF not exists idx_sa_metadata on public.site_activities using gin (metadata) TABLESPACE pg_default;

create trigger trg_site_activities_auto_hash BEFORE INSERT on site_activities for EACH row
execute FUNCTION site_activities_auto_hash ();