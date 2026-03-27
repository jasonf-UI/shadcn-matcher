create table if not exists public.match_sessions (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  matches     jsonb       not null default '[]'::jsonb,
  session_id  text,
  image_name  text
);

alter table public.match_sessions enable row level security;

create policy "anon insert"
  on public.match_sessions for insert
  with check (true);

create policy "anon select"
  on public.match_sessions for select
  using (true);
