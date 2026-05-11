const express = require('express');
const sql = require('../db/database');
const router = express.Router();

const VALID_TYPES = ['wet', 'dry', 'raw', 'treat', 'milk', 'other'];

const VALID_TEXTURES = [
  'pate', 'chunks_in_gravy', 'minced', 'shredded', 'mousse',
  'sliced', 'flaked', 'ground', 'grilled',
];

const VALID_LIFESTAGES = ['kitten', 'adult', 'senior', 'all_lifestages'];

const VALID_DIETS = [
  'chicken_free', 'gluten_free', 'grain_free', 'high_fiber', 'high_protein',
  'human_grade', 'indoor', 'limited_ingredient', 'low_fat', 'low_glycemic',
  'natural', 'no_corn_wheat_soy', 'non_gmo', 'organic', 'pea_free',
  'plant_based', 'soy_free', 'veterinary_diet', 'weight_control', 'with_grain',
];

function normalizeType(t) {
  if (!t) return 'other';
  return VALID_TYPES.includes(t) ? t : 'other';
}

function normalizeTexture(t) {
  return t && VALID_TEXTURES.includes(t) ? t : null;
}

function normalizeLifestage(t) {
  return t && VALID_LIFESTAGES.includes(t) ? t : null;
}

function normalizeDiets(arr) {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.filter(d => VALID_DIETS.includes(d)))];
}

const MAX_PRODUCT_URLS = 20;

function normalizeProductUrls(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const url = typeof item.url === 'string' ? item.url.trim() : '';
    if (!url) continue;
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    out.push(label ? { url, label } : { url });
    if (out.length >= MAX_PRODUCT_URLS) break;
  }
  return out;
}

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const type = (req.query.type || '').trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;

    const conds = [];
    const params = [];
    let i = 1;

    if (q) {
      conds.push(`(brand ILIKE $${i} OR product ILIKE $${i})`);
      params.push(`%${q}%`);
      i++;
    }
    if (type && VALID_TYPES.includes(type)) {
      conds.push(`type = $${i}`);
      params.push(type);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const totalRows = await sql.query(
      `SELECT COUNT(*)::int AS c FROM food_products ${where}`,
      params
    );
    const total = totalRows[0].c;

    const rows = await sql.query(
      `SELECT * FROM food_products ${where}
       ORDER BY LOWER(brand), LOWER(product)
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    res.json({ total, limit, offset, products: rows });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [product] = await sql`SELECT * FROM food_products WHERE id = ${id}`;
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { brand, product, type, image_url, product_urls, food_texture, lifestage, special_diet } = req.body;
    if (!brand && !product) return res.status(400).json({ error: 'Brand or product is required' });
    const [row] = await sql`
      INSERT INTO food_products (brand, product, type, image_url, product_urls, source, food_texture, lifestage, special_diet)
      VALUES (
        ${brand || ''}, ${product || ''}, ${normalizeType(type)},
        ${image_url || null}, ${JSON.stringify(normalizeProductUrls(product_urls))}::jsonb, 'user',
        ${normalizeTexture(food_texture)}, ${normalizeLifestage(lifestage)}, ${normalizeDiets(special_diet)}
      )
      RETURNING *
    `;
    res.status(201).json(row);
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'A product with this brand and name already exists' });
    }
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { brand, product, type, image_url, product_urls, food_texture, lifestage, special_diet } = req.body;
    if (!brand && !product) return res.status(400).json({ error: 'Brand or product is required' });
    const [row] = await sql`
      UPDATE food_products SET
        brand=${brand || ''}, product=${product || ''}, type=${normalizeType(type)},
        image_url=${image_url || null},
        product_urls=${JSON.stringify(normalizeProductUrls(product_urls))}::jsonb,
        food_texture=${normalizeTexture(food_texture)},
        lifestage=${normalizeLifestage(lifestage)},
        special_diet=${normalizeDiets(special_diet)}
      WHERE id=${id}
      RETURNING *
    `;
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'A product with this brand and name already exists' });
    }
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await sql`DELETE FROM food_products WHERE id = ${id} RETURNING id`;
    if (!result.length) return res.status(404).json({ error: 'Product not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
