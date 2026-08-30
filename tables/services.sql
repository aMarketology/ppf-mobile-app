create table public.services (
  id uuid not null default extensions.uuid_generate_v4 (),
  provider_id uuid not null,
  title text not null,
  description text not null,
  price numeric(10, 2) not null,
  category text not null,
  tags text[] null,
  active boolean null default true,
  created_at timestamp with time zone not null default now(),
  images text[] null default '{}'::text[],
  delivery_time text null,
  service_area text null default 'remote'::text,
  certifications text[] null,
  constraint services_pkey primary key (id),
  constraint services_provider_id_fkey foreign KEY (provider_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_services_provider_id on public.services using btree (provider_id) TABLESPACE pg_default;

create index IF not exists idx_services_active on public.services using btree (active) TABLESPACE pg_default;