create table public.products (
  id uuid not null default gen_random_uuid (),
  company_id uuid null,
  name text not null,
  description text null,
  price bigint not null,
  category text null,
  delivery_time_days integer null,
  is_active boolean null default true,
  requires_consultation boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint products_pkey primary key (id),
  constraint products_company_id_fkey foreign KEY (company_id) references company_profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_products_company on public.products using btree (company_id) TABLESPACE pg_default;

create index IF not exists idx_products_active on public.products using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_products_category on public.products using btree (category) TABLESPACE pg_default;

create index IF not exists idx_products_price on public.products using btree (price) TABLESPACE pg_default;