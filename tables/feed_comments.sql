create table public.feed_comments (
  id uuid not null default gen_random_uuid (),
  post_id uuid not null,
  author_id uuid not null,
  content text not null,
  created_at timestamp with time zone null default now(),
  constraint feed_comments_pkey primary key (id),
  constraint feed_comments_author_id_fkey foreign KEY (author_id) references auth.users (id) on delete CASCADE,
  constraint feed_comments_post_id_fkey foreign KEY (post_id) references feed_posts (id) on delete CASCADE,
  constraint feed_comments_content_check check (
    (
      (char_length(content) >= 1)
      and (char_length(content) <= 1000)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_feed_comments_post on public.feed_comments using btree (post_id, created_at) TABLESPACE pg_default;

create trigger on_comment_change
after INSERT
or DELETE on feed_comments for EACH row
execute FUNCTION update_comments_count ();

create trigger trg_comments_count
after INSERT
or DELETE on feed_comments for EACH row
execute FUNCTION update_comments_count ();