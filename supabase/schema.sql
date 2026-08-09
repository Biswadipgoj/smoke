-- supabase/schema.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- SmokeLess AI — Postgres schema (§19-20, §24).
--
-- Run this once in the Supabase SQL editor on a new project. It is idempotent:
-- re-running it is safe.
--
-- Two rules hold across every table here:
--   1. RLS is on, and every policy is `auth.uid() = user_id`. No cross-user
--      read is possible through the API even if a client query is wrong.
--   2. Every table cascades from auth.users, so account deletion is a single
--      `delete from auth.users` and cannot leave orphaned rows behind.
--
-- Column names and types mirror src/types/index.ts and the local SQLite schema
-- in src/services/db/localDb.ts. Change one, change all three.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- TODO (before this goes further than a personal build): field-level
-- encryption for the free-text `note` columns on cigarette_logs and
-- craving_logs.
--
-- RLS stops one user reading another's rows. It does not protect those rows
-- from a leaked service-role key or a policy mistake, and `note` is
-- effectively an addiction-history journal — a much worse thing to leak than a
-- to-do list. The right shape is client-side encryption with a key derived
-- from the user's credentials, so the server stores ciphertext it cannot read.
-- That is deliberately flagged here rather than half-implemented: shipping
-- crypto that looks like it works is worse than a clearly marked gap.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  locale text not null default 'en',
  coach_style text not null default 'calm',
  baseline_per_day integer not null default 10,
  started_at_ms bigint not null,
  quit_date_ms bigint,
  onboarding_complete boolean not null default false,
  currency text not null default '₹',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are self-service" on public.profiles;
create policy "profiles are self-service" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ── Cigarette logs ───────────────────────────────────────────────────────────
create table if not exists public.cigarette_logs (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  timestamp_ms bigint not null,
  count integer not null default 1,
  trigger text,
  note text, -- see the encryption TODO at the top of this file
  from_craving boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexed on timestamp from the start rather than after the timeline gets
-- slow (§27). Every read in the app is "most recent first, for this user".
create index if not exists cigarette_logs_user_ts_idx
  on public.cigarette_logs (user_id, timestamp_ms desc);

alter table public.cigarette_logs enable row level security;

drop policy if exists "own cigarette logs" on public.cigarette_logs;
create policy "own cigarette logs" on public.cigarette_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Craving logs ─────────────────────────────────────────────────────────────
create table if not exists public.craving_logs (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  timestamp_ms bigint not null,
  trigger text not null,
  intensity smallint not null check (intensity between 1 and 5),
  asked_delay_minutes integer not null,
  actual_delay_minutes integer not null default 0,
  intervention text,
  -- 'smoked' is a neutral value here, exactly like 'delayed'. Nothing in the
  -- schema, the app or the copy treats it as a failure state (§1).
  outcome text not null check (outcome in ('delayed', 'smoked', 'abandoned')),
  note text, -- see the encryption TODO at the top of this file
  created_at timestamptz not null default now()
);

create index if not exists craving_logs_user_ts_idx
  on public.craving_logs (user_id, timestamp_ms desc);

alter table public.craving_logs enable row level security;

drop policy if exists "own craving logs" on public.craving_logs;
create policy "own craving logs" on public.craving_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Price history ────────────────────────────────────────────────────────────
-- Price is time-versioned, not a constant (§15): a price rise must not
-- retroactively rewrite what every earlier cigarette cost. Cost queries join a
-- log against whichever row was effective at that log's timestamp.
create table if not exists public.price_history (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  price_per_cigarette numeric(10, 2) not null check (price_per_cigarette >= 0),
  currency text not null default '₹',
  effective_from_ms bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists price_history_user_from_idx
  on public.price_history (user_id, effective_from_ms desc);

alter table public.price_history enable row level security;

drop policy if exists "own price history" on public.price_history;
create policy "own price history" on public.price_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Goals ────────────────────────────────────────────────────────────────────
create table if not exists public.goals (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  target_per_day integer not null check (target_per_day >= 0),
  created_at_ms bigint not null,
  target_date_ms bigint,
  achieved_at_ms bigint,
  created_at timestamptz not null default now()
);

create index if not exists goals_user_created_idx
  on public.goals (user_id, created_at_ms desc);

alter table public.goals enable row level security;

drop policy if exists "own goals" on public.goals;
create policy "own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── AI memory ────────────────────────────────────────────────────────────────
-- One row per user. Aggregated behavioural summary only — top triggers, what
-- has worked, preferred tone (§6). Raw chat transcripts are never written
-- here, or anywhere else on the server; the app keeps a short rolling window
-- in memory for conversational continuity and drops it when it closes.
create table if not exists public.ai_memory (
  user_id uuid primary key references auth.users (id) on delete cascade,
  memory jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.ai_memory enable row level security;

drop policy if exists "own ai memory" on public.ai_memory;
create policy "own ai memory" on public.ai_memory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Export helper ────────────────────────────────────────────────────────────
-- Data export (§23) is a "select everything where user_id = me" job. Kept as a
-- security-invoker function so RLS still applies: the caller can only ever
-- export their own rows, even if this is called from a client.
create or replace function public.export_my_data()
returns jsonb
language sql
security invoker
stable
as $$
  select jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'cigarette_logs', coalesce((select jsonb_agg(to_jsonb(c)) from public.cigarette_logs c where c.user_id = auth.uid()), '[]'::jsonb),
    'craving_logs', coalesce((select jsonb_agg(to_jsonb(c)) from public.craving_logs c where c.user_id = auth.uid()), '[]'::jsonb),
    'price_history', coalesce((select jsonb_agg(to_jsonb(p)) from public.price_history p where p.user_id = auth.uid()), '[]'::jsonb),
    'goals', coalesce((select jsonb_agg(to_jsonb(g)) from public.goals g where g.user_id = auth.uid()), '[]'::jsonb),
    'ai_memory', (select to_jsonb(m) from public.ai_memory m where m.user_id = auth.uid())
  );
$$;
