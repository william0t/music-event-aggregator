-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- VENUES table
create table public.venues (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  address text,
  neighborhood text,
  city text not null default 'Denver',
  state text not null default 'CO',
  capacity integer,
  website_url text,
  image_url text,
  ticketmaster_venue_id text unique,
  scrape_url text,           -- URL to scrape if no API
  scrape_strategy text,      -- 'ticketmaster' | 'bandsintown' | 'custom'
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- EVENTS table
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  artist_name text not null,
  supporting_acts text[],
  venue_id uuid not null references public.venues(id) on delete cascade,
  event_date date not null,
  doors_time time,
  start_time time,
  ticket_url text,
  price_min numeric(10,2),
  price_max numeric(10,2),
  image_url text,
  description text,
  genre text,
  source text not null check (source in ('ticketmaster', 'bandsintown', 'scraped')),
  external_id text not null,  -- source-specific ID for deduplication
  is_cancelled boolean default false,
  is_sold_out boolean default false,
  raw_data jsonb,              -- store full API response for debugging
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(external_id, source)
);

-- USER PREFERENCES table
create table public.user_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  followed_venue_ids uuid[],
  followed_artists text[],
  newsletter_enabled boolean default false,
  newsletter_day text default 'Monday',
  newsletter_time text default '08:00',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index events_venue_id_idx on public.events(venue_id);
create index events_event_date_idx on public.events(event_date);
create index events_artist_name_idx on public.events(lower(artist_name));
create index events_source_external_id_idx on public.events(source, external_id);
create index venues_slug_idx on public.venues(slug);

-- Updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_venues_updated_at before update on public.venues
  for each row execute function update_updated_at_column();

create trigger update_events_updated_at before update on public.events
  for each row execute function update_updated_at_column();

create trigger update_user_preferences_updated_at before update on public.user_preferences
  for each row execute function update_updated_at_column();

-- Row Level Security
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.user_preferences enable row level security;

-- Public read on venues and events
create policy "venues are publicly readable" on public.venues
  for select using (true);

create policy "events are publicly readable" on public.events
  for select using (true);

-- User preferences: users can only read/write their own
create policy "users can read own preferences" on public.user_preferences
  for select using (auth.uid() = user_id);

create policy "users can insert own preferences" on public.user_preferences
  for insert with check (auth.uid() = user_id);

create policy "users can update own preferences" on public.user_preferences
  for update using (auth.uid() = user_id);

-- Service role can write to venues and events (for the sync job)
create policy "service role can manage venues" on public.venues
  for all using (auth.role() = 'service_role');

create policy "service role can manage events" on public.events
  for all using (auth.role() = 'service_role');
