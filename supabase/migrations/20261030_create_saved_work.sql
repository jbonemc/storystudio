-- Saved work for the Story Bank and Content Tool autosave.
-- Each participant can only read and change their own rows (matched on the
-- email in their Supabase login).
create table if not exists public.saved_work (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  tool text not null,
  title text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists saved_work_user_idx on public.saved_work (lower(user_email), updated_at desc);
alter table public.saved_work enable row level security;
create policy "Own saved work: read" on public.saved_work for select to authenticated
  using (lower(auth.jwt() ->> 'email') = lower(user_email));
create policy "Own saved work: insert" on public.saved_work for insert to authenticated
  with check (lower(auth.jwt() ->> 'email') = lower(user_email));
create policy "Own saved work: update" on public.saved_work for update to authenticated
  using (lower(auth.jwt() ->> 'email') = lower(user_email))
  with check (lower(auth.jwt() ->> 'email') = lower(user_email));
create policy "Own saved work: delete" on public.saved_work for delete to authenticated
  using (lower(auth.jwt() ->> 'email') = lower(user_email));
