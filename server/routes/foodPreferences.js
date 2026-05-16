const express = require('express');
const sql = require('../db/database');
const { summarizeEvents } = require('../lib/streaks');
const router = express.Router({ mergeParams: true });

const VALID_TYPES = ['wet', 'dry', 'raw', 'treat', 'milk', 'other'];
const VALID_REACTIONS = ['loved', 'liked', 'disliked', 'bored'];

// Re-fetch a preference with its events summarized into a streak. Used after
// any event write so the client gets fresh derived state in one response.
async function prefWithStreak(catId, id) {
  const [pref] = await sql`
    SELECT * FROM food_preferences WHERE id = ${id} AND cat_id = ${catId}
  `;
  if (!pref) return null;
  const events = await sql`
    SELECT id, reaction, occurred_on FROM food_events
    WHERE preference_id = ${id}
    ORDER BY occurred_on, id
  `;
  return { ...pref, streak: summarizeEvents(events) };
}

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
    if (!['loved', 'liked', 'disliked', 'bored', 'awaiting'].includes(status)) {
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
    // Seed an initial check-in so streak/history is uniform with backfilled
    // rows (an 'awaiting' food has no reaction yet — its first check-in resolves it).
    if (VALID_REACTIONS.includes(status)) {
      await sql`
        INSERT INTO food_events (preference_id, reaction)
        VALUES (${row.id}, ${status})
      `;
    }
    res.status(201).json(row);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const catId = parseInt(req.params.catId, 10);
    const id = parseInt(req.params.id, 10);
    const { brand, product, type, image_url, product_url, status, notes } = req.body;
    if (!brand && !product) return res.status(400).json({ error: 'Brand or product is required' });
    if (!['loved', 'liked', 'disliked', 'bored', 'awaiting'].includes(status)) {
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

// --- Reaction check-ins (loved-streak / boredom history) -------------------

// Log a dated check-in. Body: { reaction, occurred_on?, notes? }.
// Syncs food_preferences.status to the reaction (resolves 'awaiting' foods).
router.post('/:id/events', async (req, res, next) => {
  try {
    const catId = parseInt(req.params.catId, 10);
    const id = parseInt(req.params.id, 10);
    const { reaction, occurred_on, notes } = req.body;
    if (!VALID_REACTIONS.includes(reaction)) {
      return res.status(400).json({ error: 'Invalid reaction' });
    }
    if (occurred_on != null && !/^\d{4}-\d{2}-\d{2}$/.test(occurred_on)) {
      return res.status(400).json({ error: 'occurred_on must be YYYY-MM-DD' });
    }
    const [pref] = await sql`
      SELECT id FROM food_preferences WHERE id = ${id} AND cat_id = ${catId}
    `;
    if (!pref) return res.status(404).json({ error: 'Food preference not found' });

    await sql`
      INSERT INTO food_events (preference_id, reaction, occurred_on, notes)
      VALUES (${id}, ${reaction}, COALESCE(${occurred_on || null}::date, CURRENT_DATE), ${notes || null})
    `;
    await sql`UPDATE food_preferences SET status = ${reaction} WHERE id = ${id}`;

    res.status(201).json(await prefWithStreak(catId, id));
  } catch (err) { next(err); }
});

// Full check-in log for one food, most recent first (history panel).
router.get('/:id/events', async (req, res, next) => {
  try {
    const catId = parseInt(req.params.catId, 10);
    const id = parseInt(req.params.id, 10);
    const [pref] = await sql`
      SELECT id FROM food_preferences WHERE id = ${id} AND cat_id = ${catId}
    `;
    if (!pref) return res.status(404).json({ error: 'Food preference not found' });
    const events = await sql`
      SELECT id, reaction, occurred_on, notes, created_at
      FROM food_events
      WHERE preference_id = ${id}
      ORDER BY occurred_on DESC, id DESC
    `;
    res.json(events);
  } catch (err) { next(err); }
});

// Remove a mis-logged check-in, then re-sync status from the new latest
// event (back to 'awaiting' when no events remain).
router.delete('/:id/events/:eventId', async (req, res, next) => {
  try {
    const catId = parseInt(req.params.catId, 10);
    const id = parseInt(req.params.id, 10);
    const eventId = parseInt(req.params.eventId, 10);
    const [pref] = await sql`
      SELECT id FROM food_preferences WHERE id = ${id} AND cat_id = ${catId}
    `;
    if (!pref) return res.status(404).json({ error: 'Food preference not found' });

    const deleted = await sql`
      DELETE FROM food_events
      WHERE id = ${eventId} AND preference_id = ${id}
      RETURNING id
    `;
    if (!deleted.length) return res.status(404).json({ error: 'Event not found' });

    const [latest] = await sql`
      SELECT reaction FROM food_events
      WHERE preference_id = ${id}
      ORDER BY occurred_on DESC, id DESC
      LIMIT 1
    `;
    await sql`
      UPDATE food_preferences
      SET status = ${latest ? latest.reaction : 'awaiting'}
      WHERE id = ${id}
    `;

    res.json(await prefWithStreak(catId, id));
  } catch (err) { next(err); }
});

module.exports = router;
