
CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.player_streak_rewards (
  id          SERIAL PRIMARY KEY,
  player_id   INTEGER NOT NULL REFERENCES t_p83915249_biotech_anime_store.empire_players(id),
  streak_days INTEGER NOT NULL,
  claimed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reward_data JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_streak_player_days
  ON t_p83915249_biotech_anime_store.player_streak_rewards(player_id, streak_days);
