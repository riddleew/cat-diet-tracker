// Run once against the production Postgres URL to create tables.
// Usage:  DATABASE_URL=postgres://... node server/scripts/init-db.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

(async () => {
  const sql = neon(process.env.DATABASE_URL);

  // Pre-schema data migration: rename status values (liked → loved, neutral → liked).
  // Idempotent: only runs when the existing CHECK constraint still allows 'neutral'.
  const checkDef = await sql`
    SELECT pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conname = 'food_preferences_status_check'
  `;
  if (checkDef[0]?.def?.includes("'neutral'")) {
    console.log('Migrating status values: liked → loved, neutral → liked …');
    await sql`ALTER TABLE food_preferences DROP CONSTRAINT food_preferences_status_check`;
    await sql`UPDATE food_preferences SET status='loved' WHERE status='liked'`;
    await sql`UPDATE food_preferences SET status='liked' WHERE status='neutral'`;
    console.log('✓ Status values migrated.');
  }

  const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');

  // Neon's tagged sql doesn't accept multiple statements; split on `;` (naive but fine for our schema)
  const statements = schema
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await sql.query(stmt);
  }
  console.log(`✓ Schema applied (${statements.length} statements).`);
})();
