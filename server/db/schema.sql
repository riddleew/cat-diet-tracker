CREATE TABLE IF NOT EXISTS cats (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  breed      TEXT,
  notes      TEXT,
  image_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: add image_url to existing cats tables.
ALTER TABLE cats ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS food_products (
  id           SERIAL PRIMARY KEY,
  brand        TEXT NOT NULL DEFAULT '',
  product      TEXT NOT NULL DEFAULT '',
  type         TEXT NOT NULL DEFAULT 'other',
  image_url    TEXT,
  product_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  source       TEXT DEFAULT 'curated'
);

CREATE INDEX IF NOT EXISTS idx_food_products_brand ON food_products(brand);
CREATE INDEX IF NOT EXISTS idx_food_products_product ON food_products(product);
CREATE INDEX IF NOT EXISTS idx_food_products_type ON food_products(type);

-- Migration: drop legacy barcode column and switch dedup to brand+product.
ALTER TABLE food_products DROP COLUMN IF EXISTS barcode;
CREATE UNIQUE INDEX IF NOT EXISTS uq_food_products_brand_product
  ON food_products (LOWER(brand), LOWER(product));

-- Migration: add descriptor columns (texture, lifestage, special diet tags).
ALTER TABLE food_products ADD COLUMN IF NOT EXISTS food_texture TEXT;
ALTER TABLE food_products ADD COLUMN IF NOT EXISTS lifestage TEXT;
ALTER TABLE food_products ADD COLUMN IF NOT EXISTS special_diet TEXT[] NOT NULL DEFAULT '{}';

-- Migration: add series column (brand sub-line, e.g. Wellness → "Complete Health").
ALTER TABLE food_products ADD COLUMN IF NOT EXISTS series TEXT;

-- Migration: replace single product_url with product_urls JSONB array of {url, label}.
-- The data copy from product_url → product_urls happens in init-db.js BEFORE this runs.
ALTER TABLE food_products ADD COLUMN IF NOT EXISTS product_urls JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE food_products DROP COLUMN IF EXISTS product_url;

CREATE TABLE IF NOT EXISTS food_preferences (
  id          SERIAL PRIMARY KEY,
  cat_id      INTEGER NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  brand       TEXT NOT NULL DEFAULT '',
  product     TEXT,
  type        TEXT NOT NULL DEFAULT 'other',
  image_url   TEXT,
  product_url TEXT,
  status      TEXT NOT NULL CHECK (status IN ('loved', 'liked', 'disliked', 'awaiting')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_preferences_cat ON food_preferences(cat_id);

-- Migration: keep status CHECK aligned with current values.
-- The data rename (liked → loved, neutral → liked) happens in init-db.js BEFORE this runs,
-- so by the time we re-add the constraint, no rows violate it.
ALTER TABLE food_preferences DROP CONSTRAINT IF EXISTS food_preferences_status_check;
ALTER TABLE food_preferences ADD CONSTRAINT food_preferences_status_check CHECK (status IN ('loved', 'liked', 'disliked', 'bored', 'awaiting'));

-- One row per dated reaction check-in. Streak/boredom history is derived from
-- these rows (see server/lib/streaks.js); food_preferences.status stays synced
-- to the latest reaction so existing read paths keep working.
CREATE TABLE IF NOT EXISTS food_events (
  id            SERIAL PRIMARY KEY,
  preference_id INTEGER NOT NULL REFERENCES food_preferences(id) ON DELETE CASCADE,
  reaction      TEXT NOT NULL CHECK (reaction IN ('loved', 'liked', 'disliked', 'bored')),
  occurred_on   DATE NOT NULL DEFAULT CURRENT_DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_events_pref ON food_events(preference_id, occurred_on);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Backfill: seed one event per already-resolved preference so streak math is
-- uniform for pre-existing rows. Idempotent via NOT EXISTS — safe to re-run.
-- ('awaiting' rows get no seed event; their first check-in resolves them.)
INSERT INTO food_events (preference_id, reaction, occurred_on, created_at)
SELECT fp.id, fp.status, fp.created_at::date, fp.created_at
FROM food_preferences fp
WHERE fp.status IN ('loved', 'liked', 'disliked')
  AND NOT EXISTS (SELECT 1 FROM food_events fe WHERE fe.preference_id = fp.id);
