
-- Добавляем новые расы и колонки для игры "Космические Путешественники"
ALTER TABLE t_p83915249_biotech_anime_store.players
  ADD COLUMN IF NOT EXISTS race text NOT NULL DEFAULT 'terrans',
  ADD COLUMN IF NOT EXISTS buildings jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ships jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS techs jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS resources jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_agreements jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS repair_bots integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repair_kits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tick integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_tick_at timestamp with time zone NOT NULL DEFAULT now();

-- Таблица соглашений с ИИ
CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.ai_trade_agreements (
  id serial PRIMARY KEY,
  player_id integer NOT NULL REFERENCES t_p83915249_biotech_anime_store.players(id),
  agreement_type text NOT NULL, -- 'trade', 'tech', 'ceasefire'
  tech_id text,
  duration_ticks integer NOT NULL DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT now() + interval '24 hours'
);

-- Таблица магазина (покупки у ИИ)
CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.shop_purchases (
  id serial PRIMARY KEY,
  player_id integer NOT NULL REFERENCES t_p83915249_biotech_anime_store.players(id),
  item_type text NOT NULL, -- 'ship', 'tech', 'repair_bot', 'repair_kit', 'resources'
  item_id text,
  quantity integer NOT NULL DEFAULT 1,
  cost_metal integer NOT NULL DEFAULT 0,
  cost_energy integer NOT NULL DEFAULT 0,
  cost_crystals integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Добавляем чат альянса (отдельная таблица)
CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.alliance_chat (
  id serial PRIMARY KEY,
  alliance_id integer NOT NULL,
  player_id integer NOT NULL,
  nickname text NOT NULL,
  race text NOT NULL DEFAULT 'terrans',
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_ai_agreements_player ON t_p83915249_biotech_anime_store.ai_trade_agreements(player_id);
CREATE INDEX IF NOT EXISTS idx_shop_player ON t_p83915249_biotech_anime_store.shop_purchases(player_id);
CREATE INDEX IF NOT EXISTS idx_alliance_chat_alliance ON t_p83915249_biotech_anime_store.alliance_chat(alliance_id);
CREATE INDEX IF NOT EXISTS idx_alliance_chat_created ON t_p83915249_biotech_anime_store.alliance_chat(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_chat_created ON t_p83915249_biotech_anime_store.global_chat(created_at DESC);
