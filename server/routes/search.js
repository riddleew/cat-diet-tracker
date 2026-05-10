const express = require('express');
const sql = require('../db/database');
const router = express.Router();

router.get('/foods', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const tokens = q.split(/\s+/).filter(Boolean);
    const firstTok = tokens[0].toLowerCase();
    const params = tokens.map(t => `%${t}%`);
    const where = tokens
      .map((_, i) => `(brand || ' ' || COALESCE(product, '')) ILIKE $${i + 1}`)
      .join(' AND ');

    const products = await sql.query(
      `SELECT brand, product, type, image_url, product_url, source
       FROM food_products
       WHERE ${where}`,
      params
    );

    const fromPrefs = await sql.query(
      `SELECT DISTINCT brand, product, type, image_url, product_url
       FROM food_preferences
       WHERE ${where}`,
      params
    );

    const seen = new Map();
    for (const row of [...fromPrefs, ...products]) {
      const key = `${(row.brand || '').toLowerCase()}|${(row.product || '').toLowerCase()}`;
      if (!seen.has(key)) seen.set(key, row);
    }

    function score(row) {
      const brand = (row.brand || '').toLowerCase();
      const product = (row.product || '').toLowerCase();
      if (brand.startsWith(firstTok) || product.startsWith(firstTok)) return 0;
      if (product.includes(firstTok)) return 1;
      return 2;
    }

    const results = [...seen.values()]
      .sort((a, b) => {
        const s = score(a) - score(b);
        if (s !== 0) return s;
        const aFull = a.brand && a.product ? 0 : 1;
        const bFull = b.brand && b.product ? 0 : 1;
        if (aFull !== bFull) return aFull - bFull;
        const aImg = a.image_url ? 0 : 1;
        const bImg = b.image_url ? 0 : 1;
        if (aImg !== bImg) return aImg - bImg;
        return (a.brand || '').localeCompare(b.brand || '');
      })
      .slice(0, 25);

    res.json(results);
  } catch (err) { next(err); }
});

module.exports = router;
