// One-shot Open Pet Food Facts importer.
// Run locally against your Neon Postgres URL after `init-db`:
//   DATABASE_URL=postgres://... node server/scripts/seed.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const { createGunzip } = require('zlib');
const { createInterface } = require('readline');
const { Readable } = require('stream');
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const OPFF_CSV_URL = 'https://static.openpetfoodfacts.org/data/en.openpetfoodfacts.org.products.csv.gz';
const USER_AGENT = 'CatDietTracker/2.0 (personal app)';

function detectType(categoriesText, productName) {
  const text = `${categoriesText} ${productName}`.toLowerCase();
  if (/\b(raw|barf|freeze[\s-]?dried|lyophilis)/i.test(text)) return 'raw';
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

(async () => {
  const [{ c: existing }] = await sql`SELECT COUNT(*)::int AS c FROM food_products`;
  if (existing > 100) {
    console.log(`Found ${existing} products already. Skipping seed. Pass --force to override.`);
    if (!process.argv.includes('--force')) process.exit(0);
  }

  console.log('Downloading Open Pet Food Facts dataset…');
  const response = await fetch(OPFF_CSV_URL, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) {
    console.error('Download failed:', response.status);
    process.exit(1);
  }

  const gunzip = createGunzip();
  Readable.fromWeb(response.body).pipe(gunzip);
  const rl = createInterface({ input: gunzip, crlfDelay: Infinity });

  let headers = null;
  const idx = {};
  const rows = [];

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

    const categories = cols[idx.cats] || '';
    if (!isCatFood(categories)) continue;

    const { brand, product } = splitBrandProduct(cols[idx.brands], cols[idx.name]);
    if (!brand && !product) continue;

    const barcode = (cols[idx.code] || '').trim() || null;
    const image = (cols[idx.image] || '').trim() || null;

    rows.push({
      brand, product,
      type: detectType(categories, cols[idx.name] || ''),
      image_url: image,
      product_url: barcode ? `https://world.openpetfoodfacts.org/product/${barcode}` : null,
      barcode,
    });
  }

  console.log(`Parsed ${rows.length} cat food entries. Inserting…`);

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    // Build a multi-row INSERT with parameter placeholders
    const values = [];
    const params = [];
    let p = 1;
    for (const r of slice) {
      values.push(`($${p}, $${p + 1}, $${p + 2}, $${p + 3}, $${p + 4}, $${p + 5}, 'opff')`);
      params.push(r.brand, r.product, r.type, r.image_url, r.product_url, r.barcode);
      p += 6;
    }
    const stmt = `
      INSERT INTO food_products (brand, product, type, image_url, product_url, barcode, source)
      VALUES ${values.join(', ')}
      ON CONFLICT (barcode) DO NOTHING
    `;
    await sql.query(stmt, params);
    inserted += slice.length;
    process.stdout.write(`\r  ${inserted}/${rows.length}`);
  }
  console.log('\n✓ Seed complete.');
})().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
