create table public.product_orders (
  id uuid not null default gen_random_uuid (),
  order_number text not null,
  product_id uuid null,
  company_id uuid null,
  buyer_id uuid null,
  product_name text not null,
  product_price bigint not null,
  platform_fee bigint null,
  total_amount bigint not null,
  status text null default 'pending'::text,
  stripe_payment_intent_id text null,
  created_at timestamp with time zone null default now(),
  completed_at timestamp with time zone null,
  in_progress_at timestamp with time zone null,
  constraint product_orders_pkey primary key (id),
  constraint product_orders_order_number_key unique (order_number),
  constraint product_orders_buyer_id_fkey foreign KEY (buyer_id) references auth.users (id),
  constraint product_orders_company_id_fkey foreign KEY (company_id) references company_profiles (id),
  constraint product_orders_product_id_fkey foreign KEY (product_id) references products (id),
  constraint product_orders_status_check check (
    (
      status = any (
        array[
          'pending_payment'::text,
          'paid'::text,
          'in_progress'::text,
          'delivered'::text,
          'completed'::text,
          'cancelled'::text,
          'refunded'::text,
          'disputed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_orders_buyer on public.product_orders using btree (buyer_id) TABLESPACE pg_default;

create index IF not exists idx_orders_company on public.product_orders using btree (company_id) TABLESPACE pg_default;

create index IF not exists idx_orders_status on public.product_orders using btree (status) TABLESPACE pg_default;

create index IF not exists idx_orders_created on public.product_orders using btree (created_at desc) TABLESPACE pg_default;

create trigger trg_auto_unlock_conversation
after
update OF status on product_orders for EACH row
execute FUNCTION auto_unlock_conversation_on_contract ();

create trigger trg_log_order_activity
after INSERT
or
update on product_orders for EACH row
execute FUNCTION log_order_activity ();