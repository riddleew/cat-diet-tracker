// Seed script: wipes food_products and food_preferences, inserts a curated
// list of popular cat foods, then supplements with strict-filtered Open Pet
// Food Facts entries.
//
// Run locally against your Neon Postgres URL after `init-db`:
//   DATABASE_URL=postgres://... node server/scripts/seed.js --force
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const { createGunzip } = require('zlib');
const { createInterface } = require('readline');
const { Readable } = require('stream');
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const FORCE = process.argv.includes('--force');

const OPFF_CSV_URL = 'https://static.openpetfoodfacts.org/data/en.openpetfoodfacts.org.products.csv.gz';
const USER_AGENT = 'CatDietTracker/2.0 (personal app)';
const CURATED_PATH = path.join(__dirname, 'seed-data', 'cat-foods.json');

const DOG_RE = /\b(dog|dogs|chien|chiens|chiot|chiots|puppy|puppies|perro|perros|cão|cães|cao|caes|hund|hunde)\b/i;
const URL_RE = /(https?:\/\/|www\.)/i;
const PHONE_RE = /\+?\d{8,}/;
// Reject names that are mostly non-letter junk or repetitive characters.
const NON_LETTER_RE = /^[^a-zA-ZÀ-ɏ]*$/;

function detectType(categoriesText, productName) {
  const text = `${categoriesText} ${productName}`.toLowerCase();
  if (/\b(raw|barf|freeze[\s-]?dried|lyophilis|air[\s-]?dried)/i.test(text)) return 'raw';
  if (/\b(treat|snack|friandise|bite|reward|cat[\s-]?treat)/i.test(text)) return 'treat';
  if (/\b(milk|lait|kitten[\s-]?milk)/i.test(text)) return 'milk';
  if (/\b(wet|humide|p[âa]t[ée]|gravy|jelly|sauce|loaf|mousse|broth|chunks?[\s-]?in)/i.test(text)) return 'wet';
  if (/\b(dry|kibble|croquette|biscuit|crunchy|kroketten)/i.test(text)) return 'dry';
  return 'other';
}

function isCatFood(categoriesText) {
  const text = categoriesText.toLowerCase();
  return /\b(cat[\s-]?food|cat[\s-]?treat|kitten|feline|chats?\b|chatons?\b|katzen|gatos?\b|gatti|gatto|kotów|kotek|katte)/i.test(text);
}

function splitBrandProduct(brandRaw, productRaw) {
  const brand = (brandRaw || '').split(',')[0].trim();
  let product = (productRaw || '').trim();
  if (brand && product.toLowerCase().startsWith(brand.toLowerCase())) {
    product = product.slice(brand.length).trim().replace(/^[-–—:|]\s*/, '');
  }
  return { brand, product };
}

function looksLikeJunk(brand, product, categoriesText) {
  if (!brand || brand.length < 2) return true;
  if (!product || product.length < 2) return true;
  if (URL_RE.test(product) || URL_RE.test(brand)) return true;
  if (PHONE_RE.test(product) || PHONE_RE.test(brand)) return true;
  if (NON_LETTER_RE.test(product)) return true;
  if (DOG_RE.test(product) || DOG_RE.test(brand) || DOG_RE.test(categoriesText)) return true;
  return false;
}

async function insertBatch(rows, source) {
  if (!rows.length) return 0;
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const values = [];
    const params = [];
    let p = 1;
    for (const r of slice) {
      values.push(`($${p}, $${p + 1}, $${p + 2}, $${p + 3}, $${p + 4}, $${p + 5})`);
      params.push(r.brand, r.product, r.type, r.image_url || null, r.product_url || null, source);
      p += 6;
    }
    const stmt = `
      INSERT INTO food_products (brand, product, type, image_url, product_url, source)
      VALUES ${values.join(', ')}
      ON CONFLICT (LOWER(brand), LOWER(product)) DO NOTHING
    `;
    await sql.query(stmt, params);
    inserted += slice.length;
    process.stdout.write(`\r  ${inserted}/${rows.length}`);
  }
  process.stdout.write('\n');
  return inserted;
}

async function loadCurated() {
  const raw = fs.readFileSync(CURATED_PATH, 'utf8');
  const rows = JSON.parse(raw);
  return rows.map(r => ({
    brand: (r.brand || '').trim(),
    product: (r.product || '').trim(),
    type: r.type || 'other',
    image_url: r.image_url || null,
    product_url: r.product_url || null,
  })).filter(r => r.brand && r.product);
}

async function fetchOpff() {
  console.log('Downloading Open Pet Food Facts dataset…');
  const response = await fetch(OPFF_CSV_URL, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`OPFF download failed: ${response.status}`);

  const gunzip = createGunzip();
  Readable.fromWeb(response.body).pipe(gunzip);
  const rl = createInterface({ input: gunzip, crlfDelay: Infinity });

  let headers = null;
  const idx = {};
  const rows = [];
  let scanned = 0;
  let kept = 0;

  for await (const line of rl) {
    const cols = line.split('\t');
    if (!headers) {
      headers = cols;
      idx.code = headers.indexOf('code');
      idx.name = headers.indexOf('product_name');
      idx.brands = headers.indexOf('brands');
      idx.cats = headers.indexOf('categories_en');
      if (idx.cats === -1) idx.cats = headers.indexOf('categories');
      idx.image = headers.indexOf('image_url');
      if (idx.image === -1) idx.image = headers.indexOf('image_front_url');
      continue;
    }

    scanned++;
    const categories = cols[idx.cats] || '';
    if (!isCatFood(categories)) continue;

    const { brand, product } = splitBrandProduct(cols[idx.brands], cols[idx.name]);
    if (looksLikeJunk(brand, product, categories)) continue;

    const image = (cols[idx.image] || '').trim() || null;
    rows.push({
      brand,
      product,
      type: detectType(categories, cols[idx.name] || ''),
      image_url: image,
      product_url: null,
    });
    kept++;
  }

  console.log(`Scanned ${scanned} OPFF rows, kept ${kept} after strict filters.`);
  return rows;
}

(async () => {
  const [{ c: existing }] = await sql`SELECT COUNT(*)::int AS c FROM food_products`;
  if (existing > 0 && !FORCE) {
    console.log(`Found ${existing} products. Pass --force to wipe and reseed.`);
    process.exit(0);
  }

  console.log('Wiping food_products and food_preferences…');
  await sql`TRUNCATE food_products, food_preferences RESTART IDENTITY CASCADE`;

  const curated = await loadCurated();
  console.log(`Inserting ${curated.length} curated products…`);
  await insertBatch(curated, 'curated');

  const opff = await fetchOpff();
  console.log(`Inserting ${opff.length} OPFF supplements…`);
  await insertBatch(opff, 'opff');

  const [{ c: total }] = await sql`SELECT COUNT(*)::int AS c FROM food_products`;
  console.log(`✓ Seed complete. food_products now has ${total} rows.`);
})().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
