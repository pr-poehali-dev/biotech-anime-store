
CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.empire_players (
  id serial PRIMARY KEY,
  login text NOT NULL UNIQUE,
  nickname text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  session_token text,
  race text NOT NULL DEFAULT 'terrans',
  metal bigint NOT NULL DEFAULT 1000,
  energy bigint NOT NULL DEFAULT 800,
  crystals bigint NOT NULL DEFAULT 400,
  population integer NOT NULL DEFAULT 20,
  fuel bigint NOT NULL DEFAULT 500,
  dark_matter bigint NOT NULL DEFAULT 10,
  score bigint NOT NULL DEFAULT 0,
  rank_title text NOT NULL DEFAULT 'Новобранец',
  alliance_id integer NULL,
  home_planet_id integer NULL,
  colonies_count integer NOT NULL DEFAULT 1,
  fleets_count integer NOT NULL DEFAULT 0,
  total_fleet_power integer NOT NULL DEFAULT 0,
  battles_won integer NOT NULL DEFAULT 0,
  battles_lost integer NOT NULL DEFAULT 0,
  planets_conquered integer NOT NULL DEFAULT 0,
  is_online boolean NOT NULL DEFAULT false,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.empire_colonies (
  id serial PRIMARY KEY,
  player_id integer NOT NULL REFERENCES t_p83915249_biotech_anime_store.empire_players(id),
  planet_id integer NOT NULL,
  colony_name text NOT NULL DEFAULT 'Колония',
  is_capital boolean NOT NULL DEFAULT false,
  mine_level integer NOT NULL DEFAULT 0,
  solar_level integer NOT NULL DEFAULT 0,
  lab_level integer NOT NULL DEFAULT 0,
  shipyard_level integer NOT NULL DEFAULT 0,
  barracks_level integer NOT NULL DEFAULT 0,
  crystal_mine_level integer NOT NULL DEFAULT 0,
  shield_level integer NOT NULL DEFAULT 0,
  market_level integer NOT NULL DEFAULT 0,
  fuel_refinery_level integer NOT NULL DEFAULT 0,
  dark_matter_lab_level integer NOT NULL DEFAULT 0,
  metal bigint NOT NULL DEFAULT 500,
  energy bigint NOT NULL DEFAULT 300,
  crystals bigint NOT NULL DEFAULT 150,
  population integer NOT NULL DEFAULT 10,
  fuel integer NOT NULL DEFAULT 200,
  defense_hp integer NOT NULL DEFAULT 0,
  max_defense_hp integer NOT NULL DEFAULT 1000,
  last_tick_at timestamp with time zone NOT NULL DEFAULT now(),
  colonized_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.empire_techs (
  id serial PRIMARY KEY,
  player_id integer NOT NULL REFERENCES t_p83915249_biotech_anime_store.empire_players(id),
  tech_id text NOT NULL,
  level integer NOT NULL DEFAULT 0,
  researched_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(player_id, tech_id)
);

CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.empire_fleets (
  id serial PRIMARY KEY,
  owner_id integer NOT NULL REFERENCES t_p83915249_biotech_anime_store.empire_players(id),
  fleet_name text NOT NULL DEFAULT 'Флотилия 1',
  ships jsonb NOT NULL DEFAULT '{}',
  total_attack integer NOT NULL DEFAULT 0,
  total_defense integer NOT NULL DEFAULT 0,
  current_planet_id integer NULL,
  origin_planet_id integer NULL,
  target_planet_id integer NULL,
  pos_x double precision NOT NULL DEFAULT 0,
  pos_y double precision NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'orbit',
  mission text NOT NULL DEFAULT 'defend',
  speed integer NOT NULL DEFAULT 100,
  arrive_at timestamp with time zone NULL,
  fuel integer NOT NULL DEFAULT 1000,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.empire_battles (
  id serial PRIMARY KEY,
  attacker_id integer NOT NULL,
  defender_id integer NULL,
  planet_id integer NOT NULL,
  attacker_ships jsonb NOT NULL DEFAULT '{}',
  defender_ships jsonb NOT NULL DEFAULT '{}',
  attacker_losses jsonb NOT NULL DEFAULT '{}',
  defender_losses jsonb NOT NULL DEFAULT '{}',
  battle_result text NOT NULL DEFAULT 'draw',
  battle_log jsonb NOT NULL DEFAULT '[]',
  resources_looted jsonb NOT NULL DEFAULT '{}',
  battle_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.empire_chat (
  id serial PRIMARY KEY,
  player_id integer NOT NULL REFERENCES t_p83915249_biotech_anime_store.empire_players(id),
  nickname text NOT NULL,
  race text NOT NULL,
  channel text NOT NULL DEFAULT 'global',
  channel_id integer NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.empire_alliances (
  id serial PRIMARY KEY,
  alliance_name text NOT NULL UNIQUE,
  alliance_tag text NOT NULL UNIQUE,
  leader_id integer NOT NULL REFERENCES t_p83915249_biotech_anime_store.empire_players(id),
  emblem text NOT NULL DEFAULT 'star',
  alliance_desc text NULL,
  race text NOT NULL DEFAULT 'mixed',
  metal bigint NOT NULL DEFAULT 0,
  crystals bigint NOT NULL DEFAULT 0,
  members_count integer NOT NULL DEFAULT 1,
  total_score bigint NOT NULL DEFAULT 0,
  planets_controlled integer NOT NULL DEFAULT 0,
  is_recruiting boolean NOT NULL DEFAULT true,
  min_score_to_join integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.empire_diplomacy (
  id serial PRIMARY KEY,
  sender_id integer NOT NULL REFERENCES t_p83915249_biotech_anime_store.empire_players(id),
  receiver_id integer NOT NULL REFERENCES t_p83915249_biotech_anime_store.empire_players(id),
  relation_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  diplo_message text NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT now() + interval '7 days',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.empire_systems (
  id serial PRIMARY KEY,
  system_name text NOT NULL,
  pos_x integer NOT NULL,
  pos_y integer NOT NULL,
  star_type text NOT NULL DEFAULT 'yellow',
  star_size integer NOT NULL DEFAULT 5,
  sector text NOT NULL DEFAULT 'alpha',
  planet_count integer NOT NULL DEFAULT 3
);

CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.empire_planets (
  id serial PRIMARY KEY,
  planet_name text NOT NULL,
  star_system_id integer NOT NULL,
  pos_x integer NOT NULL,
  pos_y integer NOT NULL,
  orbit_slot integer NOT NULL DEFAULT 1,
  planet_type text NOT NULL DEFAULT 'terrestrial',
  biome text NOT NULL DEFAULT 'temperate',
  planet_size integer NOT NULL DEFAULT 100,
  metal_richness double precision NOT NULL DEFAULT 1.0,
  energy_richness double precision NOT NULL DEFAULT 1.0,
  crystal_richness double precision NOT NULL DEFAULT 0.5,
  special_resource text NULL,
  owner_id integer NULL REFERENCES t_p83915249_biotech_anime_store.empire_players(id),
  owner_race text NULL,
  colony_id integer NULL,
  ai_fleet_tier integer NOT NULL DEFAULT 0,
  ai_ships jsonb NOT NULL DEFAULT '{"scout": 2, "fighter": 3}',
  is_ai_controlled boolean NOT NULL DEFAULT true,
  is_colonizable boolean NOT NULL DEFAULT true,
  is_home_planet boolean NOT NULL DEFAULT false,
  planet_desc text NOT NULL DEFAULT 'Незаселённый мир',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.empire_trade (
  id serial PRIMARY KEY,
  seller_id integer NOT NULL REFERENCES t_p83915249_biotech_anime_store.empire_players(id),
  offer_resource text NOT NULL,
  offer_amount integer NOT NULL,
  want_resource text NOT NULL,
  want_amount integer NOT NULL,
  trade_status text NOT NULL DEFAULT 'open',
  buyer_id integer NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT now() + interval '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_ep2_login ON t_p83915249_biotech_anime_store.empire_players(login);
CREATE INDEX IF NOT EXISTS idx_ep2_token ON t_p83915249_biotech_anime_store.empire_players(session_token);
CREATE INDEX IF NOT EXISTS idx_ec2_player ON t_p83915249_biotech_anime_store.empire_colonies(player_id);
CREATE INDEX IF NOT EXISTS idx_ef2_owner ON t_p83915249_biotech_anime_store.empire_fleets(owner_id);
CREATE INDEX IF NOT EXISTS idx_epl2_system ON t_p83915249_biotech_anime_store.empire_planets(star_system_id);
CREATE INDEX IF NOT EXISTS idx_epl2_owner ON t_p83915249_biotech_anime_store.empire_planets(owner_id);
CREATE INDEX IF NOT EXISTS idx_echat2 ON t_p83915249_biotech_anime_store.empire_chat(channel, created_at DESC);
