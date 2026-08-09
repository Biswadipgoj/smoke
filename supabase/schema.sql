-- supabase/schema.sql
--
-- §19-20 — the full backend schema. Run this once in the Supabase SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run). SETUP.md walks through
-- it end to end.
--
-- Two rules hold throughout:
--
--   1. Every table has RLS enabled, and every policy is `auth.uid() = user_id`.
--      No cross-user read is possible through the API even if a query in the
--      app is buggy.
--   2. Every table cascades from auth.users, so account deletion is a single
--      delete rather than a checklist someone has to remember to update when a
--      table is added.
--
-- The column names mirror the local SQLite schema in
-- src/services/db/localDb.ts exactly. `trigger_key` rather than `trigger`
-- because `trigger` is reserved in both dialects.
--
-- ---------------------------------------------------------------------------
-- TODO (flagged rather than half-implemented — see the plan's pushback note on
-- RLS): field-level encryption for the free-text `note` columns before this
-- goes further than a personal build. In aggregate those notes are an
-- addiction-history journal, and RLS protects them from other users but not
-- from a leaked service-role key or a mis-set policy. Shipping crypto that
-- can't be verified here would be worse than saying plainly that it isn't done
-- yet. The columns are isolated to two tables so the change stays contained.
-- ---------------------------------------------------------------------------

-- Profiles -------------------------------------------------------------------

create table if not exists public.profiles (
  id                          uuid primary key references auth.users on delete cascade,
  language                    text not null default 'en'
                                check (language in ('en', 'hi', 'bn')),
  coach_style                 text not null default 'calm'
                                check (coach_style in ('calm','direct','scientific','encouraging','minimal')),
  baseline_cigarettes_per_day integer not null default 10 check (baseline_cigarettes_per_day >= 0),
  goal_type                   text not null default 'reduce' check (goal_type in ('reduce','quit')),
  target_cigarettes_per_day   integer not null default 5 check (target_cigarettes_per_day >= 0),
  quit_date_ms                bigint,
  created_at_ms               bigint not null,
  updated_at                  timestamptz not null default now()
);

-- Cigarette logs -------------------------------------------------------------

create table if not exists public.cigarette_logs (
  id           uuid primary key,
  user_id      uuid not null references auth.users on delete cascade,
  timestamp_ms bigint not null,
  trigger_key  text,
  note         text,           -- sensitive; see the encryption TODO above
  created_at   timestamptz not null default now()
);

-- §27 — indexed on timestamp_ms from the start rather than added once the
-- timeline screen gets slow. Every read this table serves is "mine, in a date
-- range, newest first".
create index if not exists cigarette_logs_user_ts_idx
  on public.cigarette_logs (user_id, timestamp_ms desc);

-- Craving logs ---------------------------------------------------------------

create table if not exists public.craving_logs (
  id                     uuid primary key,
  user_id                uuid not null references auth.users on delete cascade,
  timestamp_ms           bigint not null,
  trigger_key            text not null,
  intensity              smallint not null check (intensity between 1 and 5),
  intervention_id        text not null,
  delay_asked_minutes    real not null,
  delay_achieved_minutes real,
  -- No 'failed' value, by design (§1): a cigarette is a data point.
  outcome                text check (outcome in ('delayed','smoked','abandoned')),
  note                   text,   -- sensitive; see the encryption TODO above
  created_at             timestamptz not null default now()
);

create index if not exists craving_logs_user_ts_idx
  on public.craving_logs (user_id, timestamp_ms desc);

-- Price history (§15) --------------------------------------------------------
-- Time-versioned, not a constant: a cigarette is costed at whichever price was
-- effective at its own timestamp, so a price rise doesn't retroactively
-- rewrite last year's spending.

create table if not exists public.price_history (
  id                  uuid primary key,
  user_id             uuid not null references auth.users on delete cascade,
  effective_from_ms   bigint not null,
  price_per_pack      numeric(10,2) not null check (price_per_pack >= 0),
  cigarettes_per_pack integer not null check (cigarettes_per_pack > 0),
  currency            text not null default 'INR',
  created_at          timestamptz not null default now()
);

create index if not exists price_history_user_from_idx
  on public.price_history (user_id, effective_from_ms desc);

-- AI memory (§6) -------------------------------------------------------------
-- One row per user. Aggregates only — trigger frequency, effective
-- interventions, coaching-style preference. Raw chat transcripts are never
-- written here or anywhere else on the server.

create table if not exists public.ai_memory (
  user_id    uuid primary key references auth.users on delete cascade,
  payload    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security ---------------------------------------------------------

alter table public.profiles       enable row level security;
alter table public.cigarette_logs enable row level security;
alter table public.craving_logs   enable row level security;
alter table public.price_history  enable row level security;
alter table public.ai_memory      enable row level security;

-- One policy per table per verb, all of them the same shape. Written out
-- rather than generated so each one is greppable.

drop policy if exists "profiles are self-service" on public.profiles;
create policy "profiles are self-service" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own cigarette logs" on public.cigarette_logs;
create policy "own cigarette logs" on public.cigarette_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own craving logs" on public.craving_logs;
create policy "own craving logs" on public.craving_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own prices" on public.price_history;
create policy "own prices" on public.price_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own ai memory" on public.ai_memory;
create policy "own ai memory" on public.ai_memory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- New users get a profile row automatically ----------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, created_at_ms)
  values (new.id, (extract(epoch from now()) * 1000)::bigint)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Account deletion (§23) -----------------------------------------------------
-- Called from the app as `supabase.rpc('delete_my_account')`. Deleting the
-- auth.users row is enough on its own — every table above cascades from it —
-- so this function stays correct when a new table is added, as long as that
-- table also cascades.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
