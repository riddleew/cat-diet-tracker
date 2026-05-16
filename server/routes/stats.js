const express = require('express');
const sql = require('../db/database');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [totals] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM cats) AS total_cats,
        (SELECT COUNT(*)::int FROM food_preferences) AS total_foods,
        (SELECT COUNT(*)::int FROM food_preferences WHERE status = 'awaiting') AS total_awaiting,
        (SELECT COUNT(*)::int FROM food_preferences WHERE status = 'loved') AS total_loved,
        (SELECT COUNT(*)::int FROM food_preferences WHERE status = 'bored') AS total_bored,
        (SELECT COUNT(*)::int FROM food_preferences WHERE status = 'disliked') AS total_disliked
    `;

    const topBrands = await sql`
      SELECT brand, COUNT(*)::int AS loved_count
      FROM food_preferences
      WHERE status = 'loved' AND brand IS NOT NULL AND brand <> ''
      GROUP BY brand
      ORDER BY loved_count DESC, brand ASC
      LIMIT 5
    `;

    const perCat = await sql`
      WITH ranked_brand AS (
        SELECT cat_id, brand,
          COUNT(*)::int AS loved_count,
          ROW_NUMBER() OVER (PARTITION BY cat_id ORDER BY COUNT(*) DESC, brand ASC) AS rn
        FROM food_preferences
        WHERE status = 'loved' AND brand IS NOT NULL AND brand <> ''
        GROUP BY cat_id, brand
      ),
      ranked_type AS (
        SELECT cat_id, type,
          COUNT(*)::int AS type_count,
          ROW_NUMBER() OVER (PARTITION BY cat_id ORDER BY COUNT(*) DESC, type ASC) AS rn
        FROM food_preferences
        WHERE status IN ('loved', 'liked')
        GROUP BY cat_id, type
      )
      SELECT
        c.id AS cat_id,
        c.name AS cat_name,
        c.image_url AS cat_image,
        rb.brand AS top_brand,
        rb.loved_count AS top_brand_count,
        rt.type AS top_type
      FROM cats c
      LEFT JOIN ranked_brand rb ON rb.cat_id = c.id AND rb.rn = 1
      LEFT JOIN ranked_type rt ON rt.cat_id = c.id AND rt.rn = 1
      ORDER BY c.name COLLATE "C"
    `;

    res.json({ totals, topBrands, perCat });
  } catch (err) { next(err); }
});

module.exports = router;
