create table public.feed_posts (
  id uuid not null default gen_random_uuid (),
  author_id uuid not null,
  content text not null,
  post_type text not null default 'update'::text,
  media_urls text[] null default '{}'::text[],
  linked_type text null,
  linked_id uuid null,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  is_published boolean not null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  bids_count integer null default 0,
  budget numeric(10, 2) null,
  deadline text null,
  constraint feed_posts_pkey primary key (id),
  constraint feed_posts_author_id_fkey foreign KEY (author_id) references auth.users (id) on delete CASCADE,
  constraint feed_posts_content_check check (
    (
      (char_length(content) >= 1)
      and (char_length(content) <= 3000)
    )
  ),
  constraint feed_posts_linked_type_check check (
    (
      linked_type = any (
        array[
          'product'::text,
          'company'::text,
          'project'::text,
          null::text
        ]
      )
    )
  ),
  constraint feed_posts_post_type_check check (
    (
      post_type = any (
        array[
          'update'::text,
          'project_showcase'::text,
          'job_post'::text,
          'milestone'::text,
          'parts_request'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_feed_posts_author on public.feed_posts using btree (author_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_feed_posts_feed on public.feed_posts using btree (created_at desc) TABLESPACE pg_default
where
  (is_published = true);

create index IF not exists idx_feed_posts_type on public.feed_posts using btree (post_type, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_feed_posts_created on public.feed_posts using btree (created_at desc) TABLESPACE pg_default;

create trigger trg_log_feed_post_activity
after INSERT on feed_posts for EACH row
execute FUNCTION log_feed_post_activity ();