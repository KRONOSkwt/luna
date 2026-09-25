-- memories + admins allowlist + RLS (capability: memories-schema-rls)
-- Additive only; seed lives in supabase/seed.sql.

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  date date not null,                            -- calendar night; NO unique (multi-memory nights)
  title text not null,
  description text not null,
  is_first_kiss boolean not null default false,
  location text not null default 'La Paz, Bolivia',
  order_index int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index memories_date_idx on public.memories (date desc, order_index asc, created_at asc);

alter table public.memories enable row level security;

create table public.admins (email text primary key);

alter table public.admins enable row level security; -- deny-all: no policies, no grants

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.admins
                 where lower(email) = lower(auth.jwt() ->> 'email'))
$$;

grant execute on function public.is_admin() to authenticated; -- authenticated only

create policy "memories public read" on public.memories
  for select to anon, authenticated using (true);

create policy "memories admin write" on public.memories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.memories to anon, authenticated;
grant insert, update, delete on public.memories to authenticated;