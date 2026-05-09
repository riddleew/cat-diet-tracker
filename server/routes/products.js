const express = require('express');
const sql = require('../db/database');
const router = express.Router();

const VALID_TYPES = ['wet', 'dry', 'raw', 'treat', 'milk', 'other'];

function normalizeType(t) {
  if (!t) return 'other';
  return VALID_TYPES.includes(t) ? t : 'other';
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
    const { brand, product, type, image_url, product_url, barcode } = req.body;
    if (!brand && !product) return res.status(400).json({ error: 'Brand or product is required' });
    const [row] = await sql`
      INSERT INTO food_products (brand, product, type, image_url, product_url, barcode, source)
      VALUES (
        ${brand || ''}, ${product || ''}, ${normalizeType(type)},
        ${image_url || null}, ${product_url || null}, ${barcode || null}, 'user'
      )
      RETURNING *
    `;
    res.status(201).json(row);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { brand, product, type, image_url, product_url, barcode } = req.body;
    if (!brand && !product) return res.status(400).json({ error: 'Brand or product is required' });
    const [row] = await sql`
      UPDATE food_products SET
        brand=${brand || ''}, product=${product || ''}, type=${normalizeType(type)},
        image_url=${image_url || null}, product_url=${product_url || null}, barcode=${barcode || null}
      WHERE id=${id}
      RETURNING *
    `;
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  } catch (err) { next(err); }
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
