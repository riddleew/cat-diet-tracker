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
