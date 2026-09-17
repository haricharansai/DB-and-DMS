import fs from 'fs';
import path from 'path';
import { db } from './db';

type CsvRow = Record<string, string>;

const IMPORT_LIMIT = 100;
const RUPEES_PER_USD = 100;
const DEFAULT_STOCK = 10;
const PER_CATEGORY_FLAG = '--per-category';
const ADDITIONAL_FLAG = '--additional';
const NEW_VENDORS_FLAG = '--new-vendors';
const PRIMARY_VENDOR_IDS = [
  'v_soundcrafters',
  'v_nexuscomputing',
  'v_opticsvision',
  'v_ergohaven',
];

const DEMO_SELLERS = [
  ['v_dbms_import_01', 'Aarav Retail Hub', 'Aarav Kapoor', 'Bengaluru, KA'],
  ['v_dbms_import_02', 'Meera Marketplace', 'Meera Nair', 'Chennai, TN'],
  ['v_dbms_import_03', 'Saffron Commerce', 'Kabir Singh', 'New Delhi, DL'],
  ['v_dbms_import_04', 'Coastal Cart', 'Anika Rao', 'Kochi, KL'],
  ['v_dbms_import_05', 'Pioneer Goods', 'Rohan Desai', 'Ahmedabad, GJ'],
  ['v_dbms_import_06', 'Maple Street Store', 'Ishita Bose', 'Kolkata, WB'],
] as const;

const BULK_SELLER_NAMES = [
  ['Northstar Bazaar', 'Dev Malhotra', 'Jaipur, RJ'],
  ['Riverbend Retail', 'Nisha Gupta', 'Lucknow, UP'],
  ['Orbit Commerce', 'Arjun Menon', 'Thiruvananthapuram, KL'],
  ['Cedar Market', 'Sana Khan', 'Bhopal, MP'],
  ['Summit Supplies', 'Karan Bhatia', 'Chandigarh, CH'],
  ['Harbor House', 'Leela Das', 'Visakhapatnam, AP'],
  ['Mango Tree Mart', 'Vivek Shah', 'Surat, GJ'],
  ['Willow Retail Co', 'Ritu Sinha', 'Patna, BR'],
  ['Bright Cart', 'Neeraj Joshi', 'Dehradun, UK'],
  ['Evergreen Store', 'Pooja Kulkarni', 'Nagpur, MH'],
  ['Crownline Commerce', 'Aditya Roy', 'Ranchi, JH'],
  ['Golden Gate Goods', 'Kavya Pillai', 'Coimbatore, TN'],
  ['Bluebird Mart', 'Manish Yadav', 'Kanpur, UP'],
  ['Sunrise Sellers', 'Divya Reddy', 'Vijayawada, AP'],
  ['Parkside Market', 'Siddharth Jain', 'Indore, MP'],
] as const;

function requiredFilePath(): string {
  const index = process.argv.indexOf('--file');
  const supplied = index === -1 ? undefined : process.argv[index + 1];
  if (!supplied || supplied.startsWith('--')) {
    throw new Error('Usage: npm run import:dbms -- --file "C:\\path\\to\\DBMS.csv"');
  }
  return path.resolve(supplied);
}

function perCategoryCount(): number | null {
  const index = process.argv.indexOf(PER_CATEGORY_FLAG);
  if (index === -1) return null;
  const count = Number.parseInt(process.argv[index + 1], 10);
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`Usage: npm run import:dbms -- --file "C:\\path\\to\\DBMS.csv" ${PER_CATEGORY_FLAG} 50`);
  }
  return count;
}

function positiveArgument(flag: string): number | null {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  const count = Number.parseInt(process.argv[index + 1], 10);
  if (!Number.isInteger(count) || count < 1) throw new Error(`${flag} must be followed by a positive integer.`);
  return count;
}

/** Parses RFC 4180-style quoted fields without adding a runtime dependency. */
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

function readRows(filePath: string): CsvRow[] {
  const records = parseCsv(fs.readFileSync(filePath, 'utf8'));
  const [header = [], ...data] = records;
  const columns = header.map((name) => name.replace(/^\uFEFF/, '').trim());
  return data
    .filter((record) => record.some((value) => value.trim()))
    .map((record) => Object.fromEntries(columns.map((column, index) => [column, record[index] || ''])));
}

function firstDollarAmount(value: string): number | null {
  const match = value.match(/\$?\s*(\d[\d,]*(?:\s*\.\s*\d+)?)/);
  if (!match) return null;
  const amount = Number(match[1].replace(/[\s,]/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function firstImage(value: string): string[] {
  return [...new Set(value.split('|').map((url) => url.trim()).filter((url) =>
    /^https?:\/\//i.test(url) && !/transparent-pixel/i.test(url),
  ))];
}

function slug(value: string): string {
  return value.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other';
}

function positiveInteger(value: string): number | null {
  const match = value.match(/\d+/);
  if (!match) return null;
  const number = Number(match[0]);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : null;
}

function productFromRow(row: CsvRow, vendor: any) {
  const sourceId = row['Uniq Id'].trim();
  const title = row['Product Name'].trim();
  const amount = firstDollarAmount(row['Selling Price']) ?? firstDollarAmount(row['List Price']);
  const images = firstImage(row.Image);
  if (!sourceId || !title || amount === null || images.length === 0) return null;

  const categoryLabel = (row.Category.split('|')[0] || 'Other').trim();
  const description = (row['Product Description'] || row['About Product'] || title).replace(/\s*\|\s*/g, '\n').trim();
  const specs = Object.fromEntries([
    ['Model number', row['Model Number']],
    ['Product specification', row['Product Specification']],
    ['Technical details', row['Technical Details']],
    ['Product details', row['Product Details']],
    ['Product dimensions', row['Product Dimensions']],
    ['Dimensions', row.Dimensions],
    ['Shipping weight', row['Shipping Weight']],
    ['ASIN', row.Asin],
    ['SKU', row.Sku],
  ].filter(([, value]) => value?.trim()).map(([key, value]) => [key, value.trim()]));
  const color = row.Color.trim();
  const stock = positiveInteger(row.Stock) ?? positiveInteger(row.Quantity) ?? DEFAULT_STOCK;
  const price = Math.round(amount * RUPEES_PER_USD);

  return {
    id: `csv_${sourceId}`,
    slug: `${slug(title)}-${sourceId.slice(0, 8)}`,
    title,
    description,
    price,
    originalPrice: price,
    discountPercentage: 0,
    category: slug(categoryLabel),
    categoryName: categoryLabel,
    brand: row['Brand Name'].trim() || 'Generic',
    vendorId: vendor.id,
    vendorName: vendor.businessName,
    vendor: { id: vendor.id, name: vendor.businessName, isVerified: true },
    vendorVerified: true,
    status: 'published',
    rating: 0,
    reviewsCount: 0,
    stock,
    images,
    thumbnail: images[0],
    colors: color ? color.split('|').map((item) => item.trim()).filter(Boolean) : ['Default'],
    specs,
    tags: ['dbms-import', slug(categoryLabel)],
    isFeatured: false,
    isTrending: false,
    isFlashDeal: false,
  };
}

function importedCategories(rows: CsvRow[]) {
  const categories = new Map<string, { name: string; count: number }>();
  for (const row of rows) {
    const name = (row.Category.split('|')[0] || 'Other').trim();
    const key = slug(name);
    const category = categories.get(key);
    if (category) category.count += 1;
    else categories.set(key, { name, count: 1 });
  }
  return categories;
}

function sourceCategory(row: CsvRow): string {
  return slug((row.Category.split('|')[0] || 'Other').trim());
}

function isImportableRow(row: CsvRow): boolean {
  return Boolean(
    row['Uniq Id']?.trim()
    && row['Product Name']?.trim()
    && (firstDollarAmount(row['Selling Price']) ?? firstDollarAmount(row['List Price'])) !== null
    && firstImage(row.Image).length,
  );
}

function selectCategoryBatch(allRows: CsvRow[], countPerCategory: number) {
  // The first 100 rows are the original import. Excluding them makes this
  // batch deterministic: rerunning it updates the same records, not new ones.
  const originalIds = new Set(allRows.slice(0, IMPORT_LIMIT).map((row) => row['Uniq Id'].trim()));
  const targetCategories = [...importedCategories(allRows.slice(0, IMPORT_LIMIT)).keys()];
  const selected: CsvRow[] = [];
  const shortfalls: Record<string, number> = {};

  for (const category of targetCategories) {
    const candidates = allRows.filter((row) => sourceCategory(row) === category && !originalIds.has(row['Uniq Id'].trim()) && isImportableRow(row));
    selected.push(...candidates.slice(0, countPerCategory));
    if (candidates.length < countPerCategory) shortfalls[category] = candidates.length;
  }
  return { rows: selected, targetCategories, shortfalls };
}

function selectAdditionalBatch(allRows: CsvRow[], count: number) {
  // Reserve the deterministic first-100 and per-category batches so this
  // mode always selects the same additional records on every rerun.
  const reservedIds = new Set([
    ...allRows.slice(0, IMPORT_LIMIT),
    ...selectCategoryBatch(allRows, 50).rows,
  ].map((row) => row['Uniq Id'].trim()));
  const rows = allRows.filter((row) => !reservedIds.has(row['Uniq Id'].trim()) && isImportableRow(row)).slice(0, count);
  if (rows.length !== count) throw new Error(`Only ${rows.length} valid additional CSV products are available; ${count} were requested.`);
  return { rows, targetCategories: [], shortfalls: {} as Record<string, number> };
}

async function ensureCategories(rows: CsvRow[]) {
  await db.ready();
  const existingSlugs = new Set(db.find('categories', {}).map((category) => category.slug));
  const mongo = await db.getMongoDb();
  const added: string[] = [];
  for (const [categorySlug, category] of importedCategories(rows)) {
    if (existingSlugs.has(categorySlug)) continue;
    const categoryDocument = {
      id: `cat_dbms_${categorySlug}`,
      name: category.name,
      slug: categorySlug,
      iconName: 'Package',
      itemCount: category.count,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      description: `Imported DBMS catalog products in ${category.name}.`,
    };
    if (mongo) {
      await mongo.collection('categories').updateOne({ id: categoryDocument.id }, { $set: categoryDocument }, { upsert: true });
    } else {
      db.insertOne('categories', categoryDocument);
    }
    added.push(categorySlug);
  }
  return added;
}

async function syncImportedCategoryCounts() {
  const mongo = await db.getMongoDb();
  const counts = mongo
    ? await mongo.collection('products').aggregate([
      { $match: { id: /^csv_/ } },
      { $group: { _id: '$category', name: { $first: '$categoryName' }, itemCount: { $sum: 1 } } },
    ]).toArray()
    : Object.values(db.find('products', {}).filter((product) => String(product.id).startsWith('csv_')).reduce((all: Record<string, any>, product) => {
      const category = product.category;
      all[category] = all[category] || { _id: category, name: product.categoryName || category, itemCount: 0 };
      all[category].itemCount += 1;
      return all;
    }, {}));

  for (const category of counts) {
    const id = `cat_dbms_${category._id}`;
    if (mongo) await mongo.collection('categories').updateOne({ id }, { $set: { name: category.name || category._id, itemCount: category.itemCount } });
    else db.updateOne('categories', { id }, { name: category.name || category._id, itemCount: category.itemCount });
  }
}

async function sellersForImport() {
  await db.ready();
  const approved = db.find('vendors', { status: 'approved' });
  const selected = PRIMARY_VENDOR_IDS
    .map((id) => approved.find((vendor) => vendor.id === id))
    .filter(Boolean);
  const fallback = approved.filter((vendor) => !selected.some((seller) => seller.id === vendor.id));
  selected.push(...fallback.slice(0, 4 - selected.length));
  if (selected.length !== 4) {
    throw new Error(`Expected at least four approved vendors; found ${approved.length}.`);
  }

  for (const [id, businessName, ownerName, city] of DEMO_SELLERS) {
    let vendor = db.findById('vendors', id);
    if (!vendor) {
      vendor = db.insertOne('vendors', {
        id,
        businessName,
        ownerName,
        email: `${id}@example.com`,
        phone: '+91 90000 00000',
        rating: 5,
        reviewsCount: 0,
        isVerified: true,
        status: 'approved',
        badge: 'DBMS Demo Seller',
        logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        joinedDate: new Date().toISOString().slice(0, 10),
        dispatchTime: '1-2 Business Days',
        city,
        metrics: { totalRevenue: 0, totalOrders: 0, fulfillmentRate: 100 },
      });
    }
    selected.push(vendor);
  }
  return selected;
}

async function bulkSellersForImport(count: number) {
  if (count > BULK_SELLER_NAMES.length) throw new Error(`At most ${BULK_SELLER_NAMES.length} new vendors are configured.`);
  await db.ready();
  const mongo = await db.getMongoDb();
  const sellers: any[] = [];
  for (let index = 0; index < count; index += 1) {
    const id = `v_dbms_bulk_${String(index + 1).padStart(2, '0')}`;
    const [businessName, ownerName, city] = BULK_SELLER_NAMES[index];
    const existing = db.findById('vendors', id);
    const vendor = existing || {
      id,
      businessName,
      ownerName,
      email: `${id}@example.com`,
      phone: '+91 90000 00000',
      rating: 5,
      reviewsCount: 0,
      isVerified: true,
      status: 'approved',
      badge: 'DBMS Bulk Seller',
      logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      joinedDate: new Date().toISOString().slice(0, 10),
      dispatchTime: '1-2 Business Days',
      city,
      metrics: { totalRevenue: 0, totalOrders: 0, fulfillmentRate: 100 },
    };
    if (!existing) {
      if (mongo) await mongo.collection('vendors').updateOne({ id }, { $set: vendor }, { upsert: true });
      else db.insertOne('vendors', vendor);
    }
    sellers.push(vendor);
  }
  return sellers;
}

async function importProducts() {
  const filePath = requiredFilePath();
  if (!fs.existsSync(filePath)) throw new Error(`CSV file not found: ${filePath}`);

  const allRows = readRows(filePath);
  const categoryCount = perCategoryCount();
  const additionalCount = positiveArgument(ADDITIONAL_FLAG);
  const newVendorCount = positiveArgument(NEW_VENDORS_FLAG);
  if (categoryCount !== null && additionalCount !== null) throw new Error('Choose either --per-category or --additional, not both.');
  if (newVendorCount !== null && additionalCount === null) throw new Error('--new-vendors can only be used with --additional.');
  const batch = additionalCount !== null
    ? selectAdditionalBatch(allRows, additionalCount)
    : categoryCount === null
    ? { rows: allRows.slice(0, IMPORT_LIMIT), targetCategories: [], shortfalls: {} as Record<string, number> }
    : selectCategoryBatch(allRows, categoryCount);
  const rows = batch.rows;
  if (categoryCount === null && additionalCount === null && rows.length !== IMPORT_LIMIT) throw new Error(`Expected at least ${IMPORT_LIMIT} CSV rows; found ${rows.length}.`);
  if (categoryCount === null && additionalCount === null && rows.some((row) => !isImportableRow(row))) throw new Error('One or more selected CSV rows is missing an ID, title, price, or usable image.');
  const addedCategories = await ensureCategories(rows);
  const sellers = additionalCount !== null ? await bulkSellersForImport(newVendorCount || 15) : await sellersForImport();
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const distribution = new Map(sellers.map((seller) => [seller.id, 0]));

  for (const [index, row] of rows.entries()) {
    const seller = sellers[index % sellers.length];
    const product = productFromRow(row, seller);
    if (!product) {
      skipped += 1;
      continue;
    }
    const existing = await db.findCatalogProduct(product.id);
    if (existing) {
      await db.updateCatalogProduct(product.id, product);
      updated += 1;
    } else {
      await db.insertCatalogProduct(product);
      created += 1;
    }
    distribution.set(seller.id, (distribution.get(seller.id) || 0) + 1);
  }

  if (skipped > 0) throw new Error(`Import aborted: ${skipped} selected rows could not be converted into products.`);
  const sellerCounts = [...distribution.values()];
  if (sellerCounts.some((count) => count === 0) || Math.max(...sellerCounts) - Math.min(...sellerCounts) > 1) {
    throw new Error('Import failed balanced seller-distribution validation.');
  }
  await syncImportedCategoryCounts();
  console.log(JSON.stringify({
    source: filePath,
    mode: additionalCount !== null ? `additional-${additionalCount}-across-${sellers.length}-vendors` : categoryCount === null ? 'first-100' : `per-category-${categoryCount}`,
    selectedRows: rows.length,
    created,
    updated,
    skipped,
    addedCategories,
    categories: batch.targetCategories,
    shortfalls: batch.shortfalls,
    sellers: Object.fromEntries(distribution),
  }, null, 2));
}

importProducts().catch((error: Error) => {
  console.error(`DBMS import failed: ${error.message}`);
  process.exitCode = 1;
});
