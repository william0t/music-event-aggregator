-- Denver Live Music - Venue Seed Data
-- Run this after migrations to populate initial venues

INSERT INTO public.venues (name, slug, neighborhood, capacity, website_url, ticketmaster_venue_id, scrape_strategy, city, state)
VALUES
  ('Ball Arena', 'ball-arena', 'Downtown', 18000, 'https://www.ballarena.com', 'KovZpZA7AAEA', 'ticketmaster', 'Denver', 'CO'),
  ('Fiddler''s Green Amphitheatre', 'fiddlers-green', 'Greenwood Village', 18000, 'https://www.fiddlersgreenamp.com', 'KovZpZAd1aJ', 'ticketmaster', 'Greenwood Village', 'CO'),
  ('Red Rocks Amphitheatre', 'red-rocks', 'Morrison', 9525, 'https://www.redrocksonline.com', 'KovZpZAaFbZA', 'ticketmaster', 'Morrison', 'CO'),
  ('Mission Ballroom', 'mission-ballroom', 'RiNo', 3950, 'https://www.missionballroom.com', 'KovZpaAad1a', 'ticketmaster', 'Denver', 'CO'),
  ('Fillmore Auditorium', 'fillmore', 'Capitol Hill', 3900, 'https://www.fillmoreauditorium.org', 'KovZpZA7vAd', 'ticketmaster', 'Denver', 'CO'),
  ('Paramount Theatre', 'paramount', 'Downtown', 2800, 'https://www.paramountdenver.com', 'KovZpZA7AAd', 'ticketmaster', 'Denver', 'CO'),
  ('Grizzly Rose', 'grizzly-rose', 'North Denver', 2000, 'https://www.grizzlyrose.com', NULL, 'bandsintown', 'Denver', 'CO'),
  ('Gothic Theatre', 'gothic-theatre', 'Englewood', 1100, 'https://www.gothictheatre.com', 'KovZpZA7vAa', 'ticketmaster', 'Englewood', 'CO'),
  ('Bluebird Theater', 'bluebird-theater', 'Colfax', 550, 'https://www.bluebirdtheater.net', 'KovZpZA7vAJ', 'ticketmaster', 'Denver', 'CO'),
  ('Summit Music Hall', 'summit-music-hall', 'Downtown', 500, 'https://www.summitdenver.com', 'KovZpaAad1J', 'ticketmaster', 'Denver', 'CO'),
  ('Meow Wolf Perplexiplex', 'meow-wolf', 'RiNo', 480, 'https://www.meowwolf.com', NULL, 'bandsintown', 'Denver', 'CO'),
  ('Ogden Theatre', 'ogden-theatre', 'Colfax', 1600, 'https://www.ogdentheatre.com', 'KovZpZA7vAe', 'ticketmaster', 'Denver', 'CO'),
  ('Swallow Hill Music', 'swallow-hill', 'South Denver', 400, 'https://www.swallowhillmusic.org', NULL, 'bandsintown', 'Denver', 'CO'),
  ('Mercury Cafe', 'mercury-cafe', 'Uptown', 300, 'https://www.mercurycafe.com', NULL, 'bandsintown', 'Denver', 'CO'),
  ('Black Box', 'black-box', 'Capitol Hill', 300, 'https://www.blackboxdenver.co', NULL, 'bandsintown', 'Denver', 'CO'),
  ('Marquis Theatre', 'marquis-theatre', 'RiNo', 350, 'https://www.themarquistheater.com', NULL, 'bandsintown', 'Denver', 'CO'),
  ('Hi-Dive', 'hi-dive', 'South Broadway', 275, 'https://www.hi-dive.com', NULL, 'bandsintown', 'Denver', 'CO'),
  ('Globe Hall', 'globe-hall', 'North Denver', 250, 'https://www.globehall.com', NULL, 'bandsintown', 'Denver', 'CO'),
  ('Larimer Lounge', 'larimer-lounge', 'RiNo', 250, 'https://www.larimerlounge.com', NULL, 'bandsintown', 'Denver', 'CO'),
  ('HQ Denver', 'hq-denver', 'South Broadway', 250, 'https://www.hqdenver.com', NULL, 'bandsintown', 'Denver', 'CO'),
  ('Dazzle Jazz', 'dazzle-jazz', 'Downtown', 200, 'https://www.dazzledenver.com', NULL, 'bandsintown', 'Denver', 'CO'),
  ('Lost Lake Lounge', 'lost-lake', 'Colfax', 200, 'https://www.lost-lake.com', NULL, 'bandsintown', 'Denver', 'CO'),
  ('Levitt Pavilion', 'levitt-pavilion', 'Ruby Hill', 7500, 'https://www.levittdenver.org', NULL, 'bandsintown', 'Denver', 'CO'),
  ('Manos Sagrados', 'manos-sagrados', 'Aurora', 100, 'https://www.manossagrados.com', NULL, 'bandsintown', 'Aurora', 'CO'),
  ('Lion''s Lair', 'lions-lair', 'Colfax', 125, 'https://www.lionslairco.com', NULL, 'bandsintown', 'Denver', 'CO')
ON CONFLICT (slug) DO NOTHING;
