create table public.orders (
  id uuid not null default extensions.uuid_generate_v4 (),
  client_id uuid not null,
  engineer_id uuid not null,
  service_id uuid null,
  status text null default 'pending'::text,
  total_amount numeric(10, 2) not null,
  created_at timestamp with time zone not null default now(),
  constraint orders_pkey primary key (id),
  constraint orders_client_id_fkey foreign KEY (client_id) references profiles (id) on delete CASCADE,
  constraint orders_engineer_id_fkey foreign KEY (engineer_id) references profiles (id) on delete CASCADE,
  constraint orders_service_id_fkey foreign KEY (service_id) references services (id) on delete set null,
  constraint orders_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'in_progress'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_orders_client_id on public.orders using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_orders_engineer_id on public.orders using btree (engineer_id) TABLESPACE pg_default;