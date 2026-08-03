-- Dhruv — production schema
-- ─────────────────────────────────────────────────────────────────────────────
-- Server is the source of truth (account-based backend). Every table is
-- scoped to auth.uid() via Row Level Security — a user can only ever read or
-- write their own rows. Run this once against a fresh Supabase project's SQL
-- Editor (or via `supabase db push` / migrations — see SETUP.md).
--
-- Maps 1:1 onto src/domain/types.ts. Track-specific event/baseline fields are
-- stored as jsonb rather than one column per track type — the three tracks
-- (tobacco/alcohol/porn) have different shapes and this avoids a wide table
-- of mostly-null columns while keeping one queryable events table.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── profiles ─────────────────────────────────────────────────────────────────
-- One row per auth user. id IS the auth.users id (no separate surrogate key).

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  onboarding_complete boolean not null default false,
  locale text not null default 'en' check (locale in ('en', 'hi', 'bn')),
  theme_mode text not null default 'dark' check (theme_mode in ('dark', 'light', 'system', 'oled')),
  reduced_motion boolean not null default false,
  haptics_mode text not null default 'full' check (haptics_mode in ('full', 'essential', 'off')),
  app_lock_enabled boolean not null default false,
  stealth_mode_enabled boolean not null default false,
  notifications_enabled boolean not null default true,
  currency text not null default '₹' check (currency in ('₹', '৳', '$')),
  updated_at timestamptz not null default now()
);

-- ── tracks ───────────────────────────────────────────────────────────────────
-- Multi-track: a user can have up to one active row per type at a time, but
-- history is never deleted, so no uniqueness constraint on (user_id, type).

create table if not exists tracks (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('tobacco', 'alcohol', 'porn')),
  started_at timestamptz not null default now(),
  quit_date timestamptz,
  baseline jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tracks_user_idx on tracks (user_id, type);

-- ── consumption_events ───────────────────────────────────────────────────────
-- One polymorphic table for TobaccoEvent | AlcoholEvent | PornEvent. Shared
-- columns are indexed; track-specific fields (quantity/unit_cost, spend,
-- duration_bucket, ...) live in `data`.

create table if not exists consumption_events (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  track text not null check (track in ('tobacco', 'alcohol', 'porn')),
  "timestamp" timestamptz not null,
  logged_at timestamptz not null default now(),
  trigger text[] not null default '{}',
  location_context text,
  mood text,
  note text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists consumption_events_user_idx on consumption_events (user_id, track, "timestamp" desc);

-- ── urges ────────────────────────────────────────────────────────────────────
-- The urge-surfing episode. intensity_curve is the within-episode re-rating
-- series that powers the personal urge-decay stat (master doc §7.3).

create table if not exists urges (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  track text not null check (track in ('tobacco', 'alcohol', 'porn')),
  started_at timestamptz not null,
  ended_at timestamptz,
  initial_intensity smallint not null check (initial_intensity between 1 and 10),
  intensity_curve jsonb not null default '[]'::jsonb,
  trigger text[] not null default '{}',
  location_context text,
  outcome text check (outcome in ('surfed', 'alternative', 'lapsed')),
  used_breathing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists urges_user_idx on urges (user_id, track, started_at desc);

-- ── lapses ───────────────────────────────────────────────────────────────────
-- No penalty, ever. Rows here only ever get inserted — the app never
-- deletes or "resets" a lapse (master doc §7.2, §7.6).

create table if not exists lapses (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  track text not null check (track in ('tobacco', 'alcohol', 'porn')),
  "timestamp" timestamptz not null,
  trigger text[] not null default '{}',
  note text,
  linked_urge_id text references urges (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists lapses_user_idx on lapses (user_id, track, "timestamp" desc);

-- ── check_ins ────────────────────────────────────────────────────────────────
-- Once daily, optional, cross-track.

create table if not exists check_ins (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  mood text check (mood in ('good', 'okay', 'low', 'rough')),
  sleep_quality text check (sleep_quality in ('good', 'okay', 'poor')),
  halt_hungry boolean not null default false,
  halt_angry boolean not null default false,
  halt_lonely boolean not null default false,
  halt_tired boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ── thread_beads ─────────────────────────────────────────────────────────────
-- The Thread. Append-only — never updated, never deleted, never reordered.
-- This table IS the non-resetting progress model (master doc §2.2, §7.2).

create table if not exists thread_beads (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('day', 'surf', 'ash')),
  track text check (track in ('tobacco', 'alcohol', 'porn')),
  created_at timestamptz not null default now()
);

create index if not exists thread_beads_user_idx on thread_beads (user_id, created_at);

-- ── implementation_intentions ───────────────────────────────────────────────

create table if not exists implementation_intentions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  track text not null check (track in ('tobacco', 'alcohol', 'porn')),
  cue_type text not null check (cue_type in ('time', 'place', 'emotion', 'social')),
  cue text not null,
  response text not null,
  created_at timestamptz not null default now()
);

create index if not exists implementation_intentions_user_idx on implementation_intentions (user_id);

-- ── updated_at maintenance ──────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists tracks_set_updated_at on tracks;
create trigger tracks_set_updated_at before update on tracks
  for each row execute function set_updated_at();

drop trigger if exists urges_set_updated_at on urges;
create trigger urges_set_updated_at before update on urges
  for each row execute function set_updated_at();

-- ── auto-create a profile row on signup ─────────────────────────────────────

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ── Row Level Security ──────────────────────────────────────────────────────
-- A user can only ever see or write their own rows. No table here is
-- readable across users — there is no social/comparison feature in this
-- product (master doc §7.7) and no reason for cross-user access to exist.

alter table profiles enable row level security;
alter table tracks enable row level security;
alter table consumption_events enable row level security;
alter table urges enable row level security;
alter table lapses enable row level security;
alter table check_ins enable row level security;
alter table thread_beads enable row level security;
alter table implementation_intentions enable row level security;

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own tracks" on tracks;
create policy "own tracks" on tracks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own consumption_events" on consumption_events;
create policy "own consumption_events" on consumption_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own urges" on urges;
create policy "own urges" on urges for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own lapses" on lapses;
create policy "own lapses" on lapses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own check_ins" on check_ins;
create policy "own check_ins" on check_ins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own thread_beads" on thread_beads;
create policy "own thread_beads" on thread_beads for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own implementation_intentions" on implementation_intentions;
create policy "own implementation_intentions" on implementation_intentions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
