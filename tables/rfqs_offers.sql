create table public.rfq_offers (
  id uuid not null default gen_random_uuid (),
  rfq_id uuid not null,
  vendor_id uuid not null,
  client_id uuid not null,
  conversation_id uuid null,
  message_id uuid null,
  amount numeric(12, 2) not null,
  timeline text null,
  terms text null,
  notes text null,
  status text not null default 'pending'::text,
  accepted_at timestamp with time zone null,
  rejected_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint rfq_offers_pkey primary key (id),
  constraint rfq_offers_client_id_fkey foreign KEY (client_id) references auth.users (id) on delete CASCADE,
  constraint rfq_offers_conversation_id_fkey foreign KEY (conversation_id) references user_conversations (id) on delete set null,
  constraint rfq_offers_message_id_fkey foreign KEY (message_id) references user_messages (id) on delete set null,
  constraint rfq_offers_rfq_id_fkey foreign KEY (rfq_id) references rfqs (id) on delete CASCADE,
  constraint rfq_offers_vendor_id_fkey foreign KEY (vendor_id) references auth.users (id) on delete CASCADE,
  constraint rfq_offers_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'accepted'::text,
          'rejected'::text,
          'expired'::text,
          'withdrawn'::text
        ]
      )
    )
  ),
  constraint rfq_offers_amount_check check ((amount > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_rfq_offers_rfq on public.rfq_offers using btree (rfq_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_rfq_offers_vendor on public.rfq_offers using btree (vendor_id) TABLESPACE pg_default;

create index IF not exists idx_rfq_offers_client on public.rfq_offers using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_rfq_offers_status on public.rfq_offers using btree (status) TABLESPACE pg_default;