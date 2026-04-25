CREATE TABLE t_p83915249_biotech_anime_store.chat_messages (
  id          SERIAL PRIMARY KEY,
  alliance_id INTEGER NOT NULL,
  player_id   INTEGER NOT NULL,
  nickname    TEXT NOT NULL,
  faction     TEXT NOT NULL DEFAULT 'human',
  message     TEXT NOT NULL,
  msg_type    TEXT NOT NULL DEFAULT 'text',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_alliance ON t_p83915249_biotech_anime_store.chat_messages(alliance_id, created_at DESC);

CREATE TABLE t_p83915249_biotech_anime_store.global_chat (
  id         SERIAL PRIMARY KEY,
  player_id  INTEGER NOT NULL,
  nickname   TEXT NOT NULL,
  faction    TEXT NOT NULL DEFAULT 'human',
  message    TEXT NOT NULL,
  msg_type   TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_global_chat_time ON t_p83915249_biotech_anime_store.global_chat(created_at DESC);
