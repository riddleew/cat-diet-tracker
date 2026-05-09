CREATE TABLE IF NOT EXISTS cats (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  breed      TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_products (
  id          SERIAL PRIMARY KEY,
  brand       TEXT NOT NULL DEFAULT '',
  product     TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'other',
  image_url   TEXT,
  product_url TEXT,
  barcode     TEXT UNIQUE,
  source      TEXT DEFAULT 'opff'
);

CREATE INDEX IF NOT EXISTS idx_food_products_brand ON food_products(brand);
CREATE INDEX IF NOT EXISTS idx_food_products_product ON food_products(product);
CREATE INDEX IF NOT EXISTS idx_food_products_type ON food_products(type);

CREATE TABLE IF NOT EXISTS food_preferences (
  id          SERIAL PRIMARY KEY,
  cat_id      INTEGER NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  brand       TEXT NOT NULL DEFAULT '',
  product     TEXT,
  type        TEXT NOT NULL DEFAULT 'other',
  image_url   TEXT,
  product_url TEXT,
  status      TEXT NOT NULL CHECK (status IN ('liked', 'disliked', 'neutral')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_preferences_cat ON food_preferences(cat_id);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
