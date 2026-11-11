-- Tables for Devarinti Saiprasad Recipe Hub (created automatically when the server starts)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  image      TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, meal_id)
);

-- Knowledge base for Chef AI (RAG). "search" is a full-text search index built automatically.
CREATE TABLE IF NOT EXISTS recipes (
  meal_id      TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT,
  area         TEXT,
  ingredients  TEXT,
  instructions TEXT,
  image        TEXT,
  youtube      TEXT,
  search       TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category, '') || ' ' || coalesce(area, '') || ' ' || coalesce(ingredients, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(instructions, '')), 'C')
  ) STORED
);

CREATE INDEX IF NOT EXISTS recipes_search_idx ON recipes USING GIN (search);
