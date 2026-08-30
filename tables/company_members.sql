create table public.company_members (
  id uuid not null default gen_random_uuid (),
  company_id uuid not null,
  user_id uuid not null,
  role text not null default 'member'::text,
  status text not null default 'active'::text,
  invited_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint company_members_pkey primary key (id),
  constraint company_members_company_id_user_id_key unique (company_id, user_id),
  constraint company_members_company_id_fkey foreign KEY (company_id) references company_profiles (id) on delete CASCADE,
  constraint company_members_invited_by_fkey foreign KEY (invited_by) references auth.users (id) on delete set null,
  constraint company_members_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint company_members_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'invited'::text,
          'removed'::text,
          'declined'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_cm_company on public.company_members using btree (company_id) TABLESPACE pg_default;

create index IF not exists idx_cm_user on public.company_members using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_cm_status on public.company_members using btree (status) TABLESPACE pg_default;

create trigger trg_log_team_member_activity
after INSERT on company_members for EACH row
execute FUNCTION log_team_member_activity ();

create trigger trg_on_company_member_activated
after INSERT
or
update OF status on company_members for EACH row
execute FUNCTION on_company_member_activated ();

create trigger trg_sync_profile_company_id
after INSERT
or DELETE
or
update on company_members for EACH row
execute FUNCTION sync_profile_company_id ();