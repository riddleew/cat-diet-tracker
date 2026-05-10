const express = require('express');
const sql = require('../db/database');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const cats = await sql`SELECT * FROM cats ORDER BY name COLLATE "C"`;
    const counts = await sql`
      SELECT cat_id,
        SUM(CASE WHEN status='loved' THEN 1 ELSE 0 END)::int AS loved,
        SUM(CASE WHEN status='liked' THEN 1 ELSE 0 END)::int AS liked,
        SUM(CASE WHEN status='disliked' THEN 1 ELSE 0 END)::int AS disliked,
        SUM(CASE WHEN status='awaiting' THEN 1 ELSE 0 END)::int AS awaiting
      FROM food_preferences GROUP BY cat_id
    `;
    const countMap = Object.fromEntries(counts.map(c => [c.cat_id, c]));
    res.json(cats.map(cat => ({
      ...cat,
      counts: countMap[cat.id] || { loved: 0, liked: 0, disliked: 0, awaiting: 0 },
    })));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [cat] = await sql`SELECT * FROM cats WHERE id = ${id}`;
    if (!cat) return res.status(404).json({ error: 'Cat not found' });
    const foods = await sql`
      SELECT * FROM food_preferences
      WHERE cat_id = ${id}
      ORDER BY created_at DESC
    `;
    res.json({ ...cat, foods });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, breed, notes, image_url } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const [cat] = await sql`
      INSERT INTO cats (name, breed, notes, image_url)
      VALUES (${name}, ${breed || null}, ${notes || null}, ${image_url || null})
      RETURNING *
    `;
    res.status(201).json(cat);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, breed, notes, image_url } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const [cat] = await sql`
      UPDATE cats
      SET name=${name}, breed=${breed || null}, notes=${notes || null}, image_url=${image_url || null}
      WHERE id=${id}
      RETURNING *
    `;
    if (!cat) return res.status(404).json({ error: 'Cat not found' });
    res.json(cat);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await sql`DELETE FROM cats WHERE id = ${id} RETURNING id`;
    if (!result.length) return res.status(404).json({ error: 'Cat not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
