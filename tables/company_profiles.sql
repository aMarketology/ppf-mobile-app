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
  slug text null,
  industry text null,
  source text null,
  contact_name text null,
  contact_title text null,
  contact_email text null,
  contact_phone text null,
  contact_mobile text null,
  contact_linkedin text null,
  name text null,
  street_address text null,
  updated_at timestamp with time zone not null default now(),
  claimed_by uuid null,
  claimed_at timestamp with time zone null,
  stripe_account_id text null,
  constraint company_profiles_pkey primary key (id),
  constraint company_profiles_slug_key unique (slug),
  constraint company_profiles_owner_id_fkey foreign KEY (owner_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_company_owner on public.company_profiles using btree (owner_id) TABLESPACE pg_default;

create index IF not exists idx_company_verified on public.company_profiles using btree (is_verified) TABLESPACE pg_default;

create index IF not exists idx_company_location on public.company_profiles using btree (city, state) TABLESPACE pg_default;

create index IF not exists idx_company_profiles_owner on public.company_profiles using btree (owner_id) TABLESPACE pg_default;

create index IF not exists idx_company_profiles_is_claimed on public.company_profiles using btree (is_claimed) TABLESPACE pg_default;

create index IF not exists idx_company_profiles_company_name on public.company_profiles using btree (company_name) TABLESPACE pg_default;

create index IF not exists idx_company_profiles_slug on public.company_profiles using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_company_profiles_industry on public.company_profiles using btree (industry) TABLESPACE pg_default;

create trigger set_company_profiles_updated_at BEFORE
update on company_profiles for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trg_log_company_activity
after INSERT on company_profiles for EACH row
execute FUNCTION log_company_activity ();