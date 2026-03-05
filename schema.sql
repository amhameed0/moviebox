-- Run this in your Neon database SQL editor

CREATE TABLE IF NOT EXISTS movies (
  id SERIAL PRIMARY KEY,
  tiktok_url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  tmdb_id INT,
  poster_url TEXT,
  synopsis TEXT,
  release_year INT,
  genres TEXT[],
  imdb_rating NUMERIC(3,1),
  watch_status TEXT DEFAULT 'want_to_watch',
  confidence TEXT NOT NULL,
  raw_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
