const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required (set it in .env or your host\'s env vars)');
}

// `sql` is a tagged-template function. Use:
//   await sql`SELECT * FROM cats WHERE id = ${id}`
//   await sql.query('SELECT * FROM cats WHERE id = $1', [id])
const sql = neon(process.env.DATABASE_URL);

module.exports = sql;
