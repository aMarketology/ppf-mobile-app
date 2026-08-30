create table public.company_claims (
  id uuid not null default gen_random_uuid (),
  company_id uuid not null,
  user_id uuid not null,
  reason text null,
  status text not null default 'pending'::text,
  reviewed_by uuid null,
  reviewed_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  constraint company_claims_pkey primary key (id),
  constraint company_claims_company_id_fkey foreign KEY (company_id) references company_profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_company_claims_company_id on public.company_claims using btree (company_id) TABLESPACE pg_default;

create index IF not exists idx_company_claims_user_id on public.company_claims using btree (user_id) TABLESPACE pg_default;