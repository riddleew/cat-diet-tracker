const express = require('express');
const sql = require('../db/database');
const router = express.Router({ mergeParams: true });

const VALID_TYPES = ['wet', 'dry', 'raw', 'treat', 'milk', 'other'];

function normalizeType(t) {
  if (!t) return 'other';
  return VALID_TYPES.includes(t) ? t : 'other';
}

router.get('/', async (req, res, next) => {
  try {
    const catId = parseInt(req.params.catId, 10);
    const foods = await sql`
      SELECT * FROM food_preferences
      WHERE cat_id = ${catId}
      ORDER BY created_at DESC
    `;
    res.json(foods);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const catId = parseInt(req.params.catId, 10);
    const { brand, product, type, image_url, product_url, status, notes } = req.body;
    if (!brand && !product) return res.status(400).json({ error: 'Brand or product is required' });
    if (!['liked', 'disliked', 'neutral'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const [row] = await sql`
      INSERT INTO food_preferences
        (cat_id, brand, product, type, image_url, product_url, status, notes)
      VALUES (
        ${catId}, ${brand || ''}, ${product || null}, ${normalizeType(type)},
        ${image_url || null}, ${product_url || null}, ${status}, ${notes || null}
      )
      RETURNING *
    `;
    res.status(201).json(row);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const catId = parseInt(req.params.catId, 10);
    const id = parseInt(req.params.id, 10);
    const { brand, product, type, image_url, product_url, status, notes } = req.body;
    if (!brand && !product) return res.status(400).json({ error: 'Brand or product is required' });
    if (!['liked', 'disliked', 'neutral'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const [row] = await sql`
      UPDATE food_preferences SET
        brand=${brand || ''}, product=${product || null}, type=${normalizeType(type)},
        image_url=${image_url || null}, product_url=${product_url || null},
        status=${status}, notes=${notes || null}
      WHERE id=${id} AND cat_id=${catId}
      RETURNING *
    `;
    if (!row) return res.status(404).json({ error: 'Food preference not found' });
    res.json(row);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const catId = parseInt(req.params.catId, 10);
    const id = parseInt(req.params.id, 10);
    const result = await sql`
      DELETE FROM food_preferences WHERE id=${id} AND cat_id=${catId} RETURNING id
    `;
    if (!result.length) return res.status(404).json({ error: 'Food preference not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
