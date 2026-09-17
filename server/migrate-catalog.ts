import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import { createAtlasIndexPlan, ensureAtlasIndexes } from './lib/atlas-indexes';

async function migrateCatalog() {
  const mongo = await db.getMongoDb();
  if (!mongo) throw new Error('MONGODB_URI is unreachable. Start MongoDB or correct .env before migrating.');

  const backupPath = path.join(process.cwd(), 'server', 'db_data.json');
  const snapshot = JSON.parse(fs.readFileSync(backupPath, 'utf8')) as Record<string, Record<string, any>[]>;
  const collections = ['categories', 'vendors', 'users', 'reviews', 'orders', 'audit_logs'];

  for (const name of collections) {
    const documents = snapshot[name] || [];
    if (!documents.length) continue;
    await mongo.collection(name).bulkWrite(documents.map(document => ({
      updateOne: { filter: { id: document.id }, update: { $set: document }, upsert: true },
    })));
  }

  const products = (snapshot.products || []).map(product => db.normalizeCatalogProduct(product));
  await mongo.collection('products').bulkWrite(products.map(product => ({
    updateOne: { filter: { id: product.id }, update: { $set: product }, upsert: true },
  })));

  const indexResult = await ensureAtlasIndexes(mongo, createAtlasIndexPlan());
  console.log(JSON.stringify({ migrated: { products: products.length, categories: (snapshot.categories || []).length }, indexes: indexResult }, null, 2));
}

migrateCatalog().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
