create table public.feed_bids (
  id uuid not null default extensions.uuid_generate_v4 (),
  post_id uuid not null,
  bidder_id uuid not null,
  amount numeric(10, 2) not null,
  note text null,
  status text null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  constraint feed_bids_pkey primary key (id),
  constraint feed_bids_post_id_bidder_id_key unique (post_id, bidder_id),
  constraint feed_bids_bidder_id_fkey foreign KEY (bidder_id) references profiles (id) on delete CASCADE,
  constraint feed_bids_post_id_fkey foreign KEY (post_id) references feed_posts (id) on delete CASCADE,
  constraint feed_bids_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'accepted'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_feed_bids_post_id on public.feed_bids using btree (post_id) TABLESPACE pg_default;

create trigger trg_bids_count
after INSERT
or DELETE on feed_bids for EACH row
execute FUNCTION increment_bids_count ();