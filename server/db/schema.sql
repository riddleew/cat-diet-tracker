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
  id          SERIAL PRIMARY KEY,
  brand       TEXT NOT NULL DEFAULT '',
  product     TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'other',
  image_url   TEXT,
  product_url TEXT,
  source      TEXT DEFAULT 'curated'
);

CREATE INDEX IF NOT EXISTS idx_food_products_brand ON food_products(brand);
CREATE INDEX IF NOT EXISTS idx_food_products_product ON food_products(product);
CREATE INDEX IF NOT EXISTS idx_food_products_type ON food_products(type);

-- Migration: drop legacy barcode column and switch dedup to brand+product.
ALTER TABLE food_products DROP COLUMN IF EXISTS barcode;
CREATE UNIQUE INDEX IF NOT EXISTS uq_food_products_brand_product
  ON food_products (LOWER(brand), LOWER(product));

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
ALTER TABLE food_preferences ADD CONSTRAINT food_preferences_status_check CHECK (status IN ('loved', 'liked', 'disliked', 'awaiting'));

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
