
CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.player_daily_quests (
  id          SERIAL PRIMARY KEY,
  player_id   INTEGER NOT NULL REFERENCES t_p83915249_biotech_anime_store.empire_players(id),
  quest_id    TEXT    NOT NULL,
  quest_date  DATE    NOT NULL DEFAULT CURRENT_DATE,
  progress    INTEGER NOT NULL DEFAULT 0,
  target      INTEGER NOT NULL DEFAULT 1,
  completed   BOOLEAN NOT NULL DEFAULT false,
  claimed     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, quest_id, quest_date)
);

CREATE INDEX IF NOT EXISTS idx_pdq_player_date
  ON t_p83915249_biotech_anime_store.player_daily_quests(player_id, quest_date);
