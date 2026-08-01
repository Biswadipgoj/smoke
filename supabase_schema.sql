-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║          SmokeLess AI — Supabase SQL Schema                            ║
-- ║  Run this entire file in: Supabase Dashboard → SQL Editor → New query  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── 1. Profiles ─────────────────────────────────────────────────────────────
-- One row per authenticated user.  Created automatically on first sign-in.
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  locale                text    not null default 'en',
  daily_baseline        int     not null default 10,
  cost_per_pack         numeric not null default 250,
  cigs_per_pack         int     not null default 20,
  currency              text    not null default '₹',
  goal_type             text    not null default 'reduce'
                          check (goal_type in ('quit','reduce','track')),
  motivations           text[]  not null default '{}',
  start_date            timestamptz not null default now(),
  theme_mode            text    not null default 'dark'
                          check (theme_mode in ('dark','light','system')),
  notifications_enabled boolean not null default true,
  onboarding_complete   boolean not null default false,
  name                  text,
  updated_at            timestamptz not null default now()
);

comment on table public.profiles is
  'One row per user — mirrors UserProfile in the app store.';

-- ─── 2. Smoking Logs ─────────────────────────────────────────────────────────
create table if not exists public.smoking_logs (
  id          text        primary key,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  timestamp   timestamptz not null,
  type        text        not null check (type in ('cigarette','craving')),
  context_tag text        check (context_tag in
                ('stress','social','habit','boredom','alcohol','other')),
  note        text        check (char_length(note) <= 200),
  created_at  timestamptz not null default now()
);

comment on table public.smoking_logs is
  'Every logged cigarette and craving the user records.';

-- ─── 3. Delay Sessions ───────────────────────────────────────────────────────
create table if not exists public.delay_sessions (
  id               text        primary key,
  user_id          uuid        not null references auth.users (id) on delete cascade,
  started_at       timestamptz not null,
  completed_at     timestamptz,
  duration_seconds int         not null,
  intensity        int         check (intensity between 1 and 5),
  context_tag      text        check (context_tag in
                     ('stress','social','habit','boredom','alcohol','other')),
  outcome          text        not null
                     check (outcome in ('delayed','smoked','incomplete')),
  created_at       timestamptz not null default now()
);

comment on table public.delay_sessions is
  'Each craving-delay breathing session the user starts.';

-- ─── 4. Achievements ─────────────────────────────────────────────────────────
create table if not exists public.achievements (
  id          text        not null,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  earned_at   timestamptz not null default now(),
  primary key (id, user_id)
);

comment on table public.achievements is
  'Achievements/milestones unlocked by the user.';

-- ─── 5. Chat History ─────────────────────────────────────────────────────────
-- Optional: only needed if you want to persist conversations server-side.
create table if not exists public.chat_messages (
  id          text        primary key,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  role        text        not null check (role in ('user','coach')),
  content     text        not null,
  timestamp   timestamptz not null,
  created_at  timestamptz not null default now()
);

comment on table public.chat_messages is
  'AI coach conversation history (optional server-side storage).';

-- ─── 6. Row-Level Security ───────────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.smoking_logs    enable row level security;
alter table public.delay_sessions  enable row level security;
alter table public.achievements    enable row level security;
alter table public.chat_messages   enable row level security;

-- profiles: users can only read/write their own row
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- smoking_logs
create policy "logs_own" on public.smoking_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- delay_sessions
create policy "sessions_own" on public.delay_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- achievements
create policy "achievements_own" on public.achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- chat_messages
create policy "chat_own" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── 7. Auto-create profile on sign-up ───────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── 8. Updated-at trigger ───────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

-- ─── 9. Useful indexes ───────────────────────────────────────────────────────
create index if not exists idx_logs_user_ts
  on public.smoking_logs (user_id, timestamp desc);

create index if not exists idx_sessions_user_ts
  on public.delay_sessions (user_id, started_at desc);

create index if not exists idx_chat_user_ts
  on public.chat_messages (user_id, timestamp desc);
