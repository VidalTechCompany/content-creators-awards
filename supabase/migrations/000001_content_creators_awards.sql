-- Content Creators Awards — initial schema
-- Run in Supabase SQL Editor or via CLI migration.

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (extends auth.users; app "users")
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  email text,
  last_vote_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  id int primary key default 1,
  voting_deadline timestamptz,
  voting_open boolean not null default true,
  extra jsonb not null default '{}'::jsonb,
  constraint site_settings_singleton check (id = 1)
);

insert into public.site_settings (id) values (1) on conflict do nothing;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  section text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  -- Ensure we don't have duplicate subcategory names within the same category
  unique (category_id, name)
);

create table public.nominees (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  subcategory_id uuid references public.subcategories (id) on delete set null,
  name text not null, -- Official Name
  known_name text,
  slug text not null,
  bio text,
  image_url text,
  social_links jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, slug)
);

create index nominees_category_idx on public.nominees (category_id);
create index nominees_subcategory_idx on public.nominees (subcategory_id);
create index nominees_status_idx on public.nominees (status);

create table public.nominee_stats (
  nominee_id uuid primary key references public.nominees (id) on delete cascade,
  vote_count bigint not null default 0
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  nominee_id uuid not null references public.nominees (id) on delete cascade,
  ip_address inet,
  user_agent text, 
  fingerprint text,
  created_at timestamptz not null default now(),
  -- One account = one vote per category
  unique (user_id, category_id),
  -- Prevent multiple accounts from the same device voting in the same category
  unique (fingerprint, category_id)
);

create index votes_user_idx on public.votes (user_id);
create index votes_created_idx on public.votes (created_at desc);
create index votes_ip_idx on public.votes (ip_address);
create index votes_fingerprint_idx on public.votes (fingerprint);

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('super_admin', 'moderator')),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);

create table public.suspicious_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  reason text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  tier text not null default 'partner',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Vote count aggregation (Realtime-friendly, no PII)
create or replace function public.increment_nominee_stat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.nominee_stats (nominee_id, vote_count)
  values (new.nominee_id, 1)
  on conflict (nominee_id) do update
    set vote_count = public.nominee_stats.vote_count + 1;
  return new;
end;
$$;

create or replace function public.decrement_nominee_stat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.nominee_stats
  set vote_count = greatest(0, vote_count - 1)
  where nominee_id = old.nominee_id;
  return old;
end;
$$;

drop trigger if exists trg_votes_increment on public.votes;
create trigger trg_votes_increment
  after insert on public.votes
  for each row execute function public.increment_nominee_stat();

drop trigger if exists trg_votes_decrement on public.votes;
create trigger trg_votes_decrement
  after delete on public.votes
  for each row execute function public.decrement_nominee_stat();

-- Profile bootstrap
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger nominees_updated_at before update on public.nominees
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.nominees enable row level security;
alter table public.nominee_stats enable row level security;
alter table public.votes enable row level security;
alter table public.admins enable row level security;
alter table public.audit_logs enable row level security;
alter table public.suspicious_activity enable row level security;
alter table public.sponsors enable row level security;

-- Profiles: own row
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Site settings: public read voting flags (no secrets in row)
create policy "site_settings_public_read" on public.site_settings
  for select using (true);

-- Categories: public read
create policy "categories_public_read" on public.categories
  for select using (true);

-- Subcategories: public read
create policy "subcategories_public_read" on public.subcategories
  for select using (true);

-- Nominees: approved only for public
create policy "nominees_public_read_approved" on public.nominees
  for select using (status = 'approved');

-- Stats: public read aggregates
create policy "nominee_stats_public_read" on public.nominee_stats
  for select using (true);

-- Votes: no client access (server uses service role)
-- RLS enabled with no policies => deny for anon/authenticated via REST

-- Admins: read own membership
create policy "admins_select_self" on public.admins
  for select to authenticated using (auth.uid() = user_id);

create policy "super_admins_manage_roles" on public.admins
  for all to authenticated using (
    exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'super_admin')
  ) with check (
    exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'super_admin')
  );

-- Admin write policies (Restricted by role)
create policy "admins_all_if_admin" on public.categories
  for all to authenticated using (
    exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'super_admin')
  ) with check (
    exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'super_admin')
  );

create policy "admins_subcategories_all" on public.subcategories
  for all to authenticated using (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

create policy "admins_nominees_all" on public.nominees
  for all to authenticated using (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

create policy "admins_nominee_stats_write" on public.nominee_stats
  for all to authenticated using (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

create policy "admins_sponsors_all" on public.sponsors
  for all to authenticated using (
    exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'super_admin')
  ) with check (
    exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'super_admin')
  );

create policy "admins_site_settings_update" on public.site_settings
  for update to authenticated using (
    exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'super_admin')
  ) with check (
    exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'super_admin')
  );

create policy "admins_audit_read" on public.audit_logs
  for select to authenticated using (
    exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'super_admin')
  );

create policy "admins_audit_insert" on public.audit_logs
  for insert to authenticated with check ( -- Allow moderators to log actions too
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

create policy "admins_suspicious_read" on public.suspicious_activity
  for select to authenticated using (
    exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'super_admin')
  );

create policy "admins_suspicious_insert" on public.suspicious_activity
  for insert to authenticated with check (
    exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'super_admin')
  );

-- Seed categories (13 award sections)
insert into public.categories (slug, title, section, description, sort_order) values
  ('tiktok', 'TikTok Categories', 'TikTok', 'Short-form excellence on TikTok.', 10),
  ('youtube', 'YouTube Categories', 'YouTube', 'Long and short form creators on YouTube.', 20),
  ('instagram', 'Instagram Categories', 'Instagram', 'Visual storytelling and community on Instagram.', 30),
  ('lifestyle-culture', 'Lifestyle & Culture', 'Lifestyle & Culture', 'Culture, wellness, and everyday inspiration.', 40),
  ('entertainment', 'Entertainment Categories', 'Entertainment', 'Comedy, performance, and show-stopping moments.', 50),
  ('business-education', 'Business & Educational Categories', 'Business & Education', 'Learning, finance, and professional growth.', 60),
  ('podcast-media', 'Podcast & Media Categories', 'Podcast & Media', 'Audio-first storytelling and media innovation.', 70),
  ('fashion-beauty', 'Fashion & Beauty', 'Fashion & Beauty', 'Style, beauty, and creative direction.', 80),
  ('photo-video', 'Photography & Videography', 'Photography & Videography', 'Craft, cinematography, and visual art.', 90),
  ('brand-marketing', 'Brand & Marketing Awards', 'Brand & Marketing', 'Campaigns, partnerships, and brand building.', 100),
  ('community-impact', 'Community & Impact Awards', 'Community & Impact', 'Giving back and driving positive change.', 110),
  ('special-recognition', 'Special Recognition Awards', 'Special Recognition', 'Lifetime and standout achievements.', 120),
  ('fun', 'Fun Categories', 'Fun', 'Lighthearted and fan-favorite moments.', 130)
on conflict (slug) do nothing;

-- Seed subcategories
-- Using subqueries to find the correct category_id based on the slug
insert into public.subcategories (category_id, name) values
  -- TikTok
  ((select id from public.categories where slug = 'tiktok'), 'Best TikTok Creator'),
  ((select id from public.categories where slug = 'tiktok'), 'Best Comedy TikToker'),
  ((select id from public.categories where slug = 'tiktok'), 'Best Male Dancer'),
  ((select id from public.categories where slug = 'tiktok'), 'Best Female Dancer'),
  ((select id from public.categories where slug = 'tiktok'), 'Best Lifestyle TikToker'),
  ((select id from public.categories where slug = 'tiktok'), 'Best Couple Content Creator'),
  ((select id from public.categories where slug = 'tiktok'), 'Best Educational TikTok Creator'),
  ((select id from public.categories where slug = 'tiktok'), 'Best Viral Content'),

  -- YouTube
  ((select id from public.categories where slug = 'youtube'), 'Best YouTuber'),
  ((select id from public.categories where slug = 'youtube'), 'Best Vlog Channel'),
  ((select id from public.categories where slug = 'youtube'), 'Best Entertainment Channel'),
  ((select id from public.categories where slug = 'youtube'), 'Best Documentary Creator'),
  ((select id from public.categories where slug = 'youtube'), 'Best Storytelling Creator'),
  ((select id from public.categories where slug = 'youtube'), 'Best Short-Form Video Creator'),
  ((select id from public.categories where slug = 'youtube'), 'Best Long-Form Content Creator'),

  -- Instagram
  ((select id from public.categories where slug = 'instagram'), 'Best Instagram Creator'),
  ((select id from public.categories where slug = 'instagram'), 'Best Fashion Influencer'),
  ((select id from public.categories where slug = 'instagram'), 'Best Beauty Creator'),
  ((select id from public.categories where slug = 'instagram'), 'Best Travel Creator'),
  ((select id from public.categories where slug = 'instagram'), 'Best Food Content Creator'),
  ((select id from public.categories where slug = 'instagram'), 'Best Photography Page'),

  -- Lifestyle & Culture
  ((select id from public.categories where slug = 'lifestyle-culture'), 'Best Fitness Creator'),
  ((select id from public.categories where slug = 'lifestyle-culture'), 'Best Wellness Creator'),
  ((select id from public.categories where slug = 'lifestyle-culture'), 'Best Parenting Creator'),
  ((select id from public.categories where slug = 'lifestyle-culture'), 'Best Campus Creator'),
  ((select id from public.categories where slug = 'lifestyle-culture'), 'Best Relationship Content Creator'),
  ((select id from public.categories where slug = 'lifestyle-culture'), 'Best Motivational Creator'),

  -- Entertainment
  ((select id from public.categories where slug = 'entertainment'), 'Best Comedy Creator'),
  ((select id from public.categories where slug = 'entertainment'), 'Best Prank Creator'),
  ((select id from public.categories where slug = 'entertainment'), 'Best Dance Crew'),
  ((select id from public.categories where slug = 'entertainment'), 'Best Music Content Creator'),
  ((select id from public.categories where slug = 'entertainment'), 'Best DJ Content Creator'),
  ((select id from public.categories where slug = 'entertainment'), 'Best Celebrity Influencer'),

  -- Business & Education
  ((select id from public.categories where slug = 'business-education'), 'Best Business Creator'),
  ((select id from public.categories where slug = 'business-education'), 'Best Financial Education Creator'),
  ((select id from public.categories where slug = 'business-education'), 'Best Tech Creator'),
  ((select id from public.categories where slug = 'business-education'), 'Best Educational Platform'),
  ((select id from public.categories where slug = 'business-education'), 'Best Entrepreneur Creator'),

  -- Podcast & Media
  ((select id from public.categories where slug = 'podcast-media'), 'Best Podcast'),
  ((select id from public.categories where slug = 'podcast-media'), 'Best Podcast Host'),
  ((select id from public.categories where slug = 'podcast-media'), 'Best Online Media Platform'),
  ((select id from public.categories where slug = 'podcast-media'), 'Best Interview Series'),

  -- Fashion & Beauty
  ((select id from public.categories where slug = 'fashion-beauty'), 'Best Fashion Stylist Creator'),
  ((select id from public.categories where slug = 'fashion-beauty'), 'Best Makeup Creator'),
  ((select id from public.categories where slug = 'fashion-beauty'), 'Best Hair & Beauty Creator'),
  ((select id from public.categories where slug = 'fashion-beauty'), 'Best Fashion Brand Collaboration'),

  -- Photography & Videography
  ((select id from public.categories where slug = 'photo-video'), 'Best Photographer'),
  ((select id from public.categories where slug = 'photo-video'), 'Best Videographer'),
  ((select id from public.categories where slug = 'photo-video'), 'Best Cinematic Creator'),
  ((select id from public.categories where slug = 'photo-video'), 'Best Event Coverage Team'),

  -- Brand & Marketing
  ((select id from public.categories where slug = 'brand-marketing'), 'Best Brand Influencer'),
  ((select id from public.categories where slug = 'brand-marketing'), 'Best Sponsored Campaign'),
  ((select id from public.categories where slug = 'brand-marketing'), 'Best Brand Collaboration'),
  ((select id from public.categories where slug = 'brand-marketing'), 'Most Influential Brand Ambassador'),

  -- Community & Impact
  ((select id from public.categories where slug = 'community-impact'), 'Social Impact Creator Award'),
  ((select id from public.categories where slug = 'community-impact'), 'Community Champion Award'),
  ((select id from public.categories where slug = 'community-impact'), 'Youth Inspiration Award'),
  ((select id from public.categories where slug = 'community-impact'), 'Mental Health Awareness Creator'),
  ((select id from public.categories where slug = 'community-impact'), 'Environmental Awareness Creator'),

  -- Special Recognition
  ((select id from public.categories where slug = 'special-recognition'), 'Lifetime Achievement Award'),
  ((select id from public.categories where slug = 'special-recognition'), 'Hall of Fame Award'),
  ((select id from public.categories where slug = 'special-recognition'), 'Pioneer Creator Award'),
  ((select id from public.categories where slug = 'special-recognition'), 'Icon Award'),
  ((select id from public.categories where slug = 'special-recognition'), 'Outstanding Contribution to Digital Media'),

  -- Fun
  ((select id from public.categories where slug = 'fun'), 'Best Celebrity Lookalike Creator'),
  ((select id from public.categories where slug = 'fun'), 'Best Meme Page'),
  ((select id from public.categories where slug = 'fun'), 'Most Entertaining Live Creator'),
  ((select id from public.categories where slug = 'fun'), 'Most Interactive Creator'),
  ((select id from public.categories where slug = 'fun'), 'Fan Favorite Creator')
on conflict (category_id, name) do nothing;

-- Storage: create bucket "nominee-images" in Dashboard, then:
-- Policies (run after bucket exists):
-- insert into storage.buckets (id, name, public) values ('nominee-images', 'nominee-images', true);
-- See README for Storage policy snippets.

-- Enable Realtime for live updates
alter publication supabase_realtime add table public.nominee_stats;
alter publication supabase_realtime add table public.site_settings;

comment on table public.votes is 'Inserted only via trusted server (service role) after CAPTCHA and checks.';
comment on table public.nominee_stats is 'Subscribe via Realtime for live counts without exposing vote rows.';
