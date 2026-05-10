const express = require('express');
const sql = require('../db/database');
const router = express.Router();

router.get('/foods', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const pattern = `%${q}%`;
    const qLow = q.toLowerCase();

    const products = await sql`
      SELECT brand, product, type, image_url, product_url, source
      FROM food_products
      WHERE brand ILIKE ${pattern} OR product ILIKE ${pattern}
    `;

    const fromPrefs = await sql`
      SELECT DISTINCT brand, product, type, image_url, product_url
      FROM food_preferences
      WHERE brand ILIKE ${pattern}
         OR (product IS NOT NULL AND product ILIKE ${pattern})
    `;

    const seen = new Map();
    for (const row of [...fromPrefs, ...products]) {
      const key = `${(row.brand || '').toLowerCase()}|${(row.product || '').toLowerCase()}`;
      if (!seen.has(key)) seen.set(key, row);
    }

    function score(row) {
      const brand = (row.brand || '').toLowerCase();
      const product = (row.product || '').toLowerCase();
      if (brand.startsWith(qLow) || product.startsWith(qLow)) return 0;
      if (product.includes(qLow)) return 1;
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
