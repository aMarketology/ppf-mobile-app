create table public.company_profiles (
  id uuid not null default gen_random_uuid (),
  owner_id uuid null,
  company_name text not null,
  description text null,
  email text null,
  phone text null,
  website text null,
  address text null,
  city text null,
  state text null,
  zip_code text null,
  specialties text[] null,
  certifications text[] null,
  is_verified boolean null default false,
  is_claimed boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint company_profiles_pkey primary key (id),
  constraint company_profiles_owner_id_fkey foreign KEY (owner_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_company_owner on public.company_profiles using btree (owner_id) TABLESPACE pg_default;

create index IF not exists idx_company_verified on public.company_profiles using btree (is_verified) TABLESPACE pg_default;

create index IF not exists idx_company_location on public.company_profiles using btree (city, state) TABLESPACE pg_default;

create index IF not exists idx_company_profiles_owner on public.company_profiles using btree (owner_id) TABLESPACE pg_default;