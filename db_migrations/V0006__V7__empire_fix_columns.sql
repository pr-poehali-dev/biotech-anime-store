
ALTER TABLE t_p83915249_biotech_anime_store.empire_alliances
  ADD COLUMN IF NOT EXISTS alliance_name text DEFAULT 'Безымянный',
  ADD COLUMN IF NOT EXISTS alliance_tag text DEFAULT 'TAG',
  ADD COLUMN IF NOT EXISTS alliance_desc text;

UPDATE t_p83915249_biotech_anime_store.empire_alliances
SET alliance_name = name, alliance_tag = tag, alliance_desc = description
WHERE alliance_name = 'Безымянный' OR alliance_name IS NULL;

ALTER TABLE t_p83915249_biotech_anime_store.empire_players
  ADD COLUMN IF NOT EXISTS battles_won integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS battles_lost integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS planets_conquered integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS fleets_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_fleet_power integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS colonies_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS home_planet_id integer NULL,
  ADD COLUMN IF NOT EXISTS fuel bigint NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS dark_matter bigint NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS rank_title text NOT NULL DEFAULT 'Новобранец',
  ADD COLUMN IF NOT EXISTS alliance_id integer NULL;

ALTER TABLE t_p83915249_biotech_anime_store.empire_trade
  ADD COLUMN IF NOT EXISTS trade_status text NOT NULL DEFAULT 'open';

ALTER TABLE t_p83915249_biotech_anime_store.empire_diplomacy
  ADD COLUMN IF NOT EXISTS diplo_message text,
  ADD COLUMN IF NOT EXISTS relation_type text DEFAULT 'peace';

ALTER TABLE t_p83915249_biotech_anime_store.empire_planets
  ADD COLUMN IF NOT EXISTS planet_desc text NOT NULL DEFAULT 'Незаселённый мир';

UPDATE t_p83915249_biotech_anime_store.empire_planets
SET planet_desc = description WHERE planet_desc = 'Незаселённый мир' AND description IS NOT NULL;
