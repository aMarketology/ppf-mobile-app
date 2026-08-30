create table public.rfqs (
  id uuid not null default gen_random_uuid (),
  client_id uuid not null,
  title text not null,
  category text not null,
  description text not null,
  quantity text null,
  budget text null,
  timeline text null,
  location text null,
  attachment_urls text[] null default '{}'::text[],
  status text not null default 'open'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  slug text null,
  material text null,
  rfq_type text not null default 'service'::text,
  nda_required boolean not null default false,
  is_asap boolean not null default false,
  line_items jsonb not null default '[]'::jsonb,
  constraint rfqs_pkey primary key (id),
  constraint rfqs_client_id_fkey foreign KEY (client_id) references profiles (id) on delete CASCADE,
  constraint rfqs_rfq_type_check check (
    (
      rfq_type = any (array['product'::text, 'service'::text])
    )
  ),
  constraint rfqs_status_check check (
    (
      status = any (
        array[
          'open'::text,
          'in_review'::text,
          'awarded'::text,
          'closed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists idx_rfqs_slug on public.rfqs using btree (slug) TABLESPACE pg_default
where
  (slug is not null);

create trigger rfqs_updated_at_trigger BEFORE
update on rfqs for EACH row
execute FUNCTION rfqs_updated_at ();

create trigger trg_log_rfq_activity
after INSERT
or
update on rfqs for EACH row
execute FUNCTION log_rfq_activity ();