create table public.token_transactions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  amount integer not null,
  balance_after integer not null,
  type text not null,
  description text null,
  stripe_payment_id text null,
  reference_id uuid null,
  created_at timestamp with time zone not null default now(),
  constraint token_transactions_pkey primary key (id),
  constraint token_transactions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_token_tx_user on public.token_transactions using btree (user_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_token_tx_stripe on public.token_transactions using btree (stripe_payment_id) TABLESPACE pg_default;

create index IF not exists idx_token_tx_type on public.token_transactions using btree (type) TABLESPACE pg_default;

create unique INDEX IF not exists uniq_token_tx_stripe on public.token_transactions using btree (stripe_payment_id) TABLESPACE pg_default
where
  (stripe_payment_id is not null);