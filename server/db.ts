import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { MongoClient, Db } from 'mongodb';
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_VENDORS, SEED_USERS, SEED_REVIEWS } from '../src/data/seedData';
import bcrypt from 'bcryptjs';
import { ensureAtlasIndexes, createAtlasIndexPlan } from './lib/atlas-indexes';

const DB_FILE_PATH = path.join(process.cwd(), 'server', 'db_data.json');

export interface MongoDocument {
  _id: string;
  id?: string;
  [key: string]: any;
}

export interface CollectionStats {
  name: string;
  count: number;
  sizeBytes: number;
  indexes: string[];
}

export class MongoDatabase {
  private collections: Map<string, MongoDocument[]> = new Map();
  private isInitialized = false;
  private client: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private initialization: Promise<void>;
  private mongoUrl = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/marketnexus';

  constructor() {
    this.initialization = this.init();
  }

  public async ready(): Promise<void> { await this.initialization; }

  public getRuntimeStatus() {
    return { mode: this.mongoDb ? 'mongodb' : 'local-json-fallback', connected: Boolean(this.mongoDb) };
  }

  public async getMongoDb(): Promise<Db | null> {
    await this.ready();
    return this.mongoDb;
  }

  public async init() {
    if (this.isInitialized) return;

    // 1. Try connecting to real MongoDB first
    try {
      this.client = new MongoClient(this.mongoUrl);
      await this.client.connect();
      const urlParts = this.mongoUrl.split('/');
      const rawDbName = urlParts[urlParts.length - 1].split('?')[0];
      const dbName = rawDbName || 'marketnexus';
      this.mongoDb = this.client.db(dbName);
      const indexResult = await ensureAtlasIndexes(this.mongoDb, createAtlasIndexPlan());
      if (indexResult.warnings.length) console.warn('MongoDB index warnings:', indexResult.warnings.join('; '));
      console.log(`🍃 Connected to MongoDB instance at ${this.mongoUrl}`);

      const collections = await this.mongoDb.listCollections().toArray();
      const collNames = collections.map(c => c.name);
      const targetCollections = ['categories', 'vendors', 'products', 'users', 'reviews', 'orders', 'audit_logs'];

      for (const collName of targetCollections) {
        if (collNames.includes(collName)) {
          const docs = await this.mongoDb.collection(collName).find({}).toArray();
          this.collections.set(collName, docs as any);
        } else {
          this.collections.set(collName, []);
        }
      }

      const existingUsers = (this.collections.get('users') || []).length;
      if (existingUsers > 0) {
        this.isInitialized = true;
        console.log(`✅ Loaded ${existingUsers} users from real MongoDB database '${dbName}'`);
        return;
      }
    } catch (err: any) {
      console.warn(`⚠️ External MongoDB connection failed (${err.message}). Using local database engine.`);
    }

    // 2. Load from disk backup if MongoDB was empty or unavailable
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const rawData = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(rawData);
        for (const [key, value] of Object.entries(parsed)) {
          this.collections.set(key, value as MongoDocument[]);
        }
        this.isInitialized = true;
        console.log('📦 Database loaded from disk backup (server/db_data.json)');
        
        // Sync disk backup into real MongoDB if connected
        if (this.mongoDb) {
          await this.syncAllToMongo();
        }
        return;
      } catch (err) {
        console.error('Failed to load database from disk backup:', err);
      }
    }

    // 3. Seed initial data
    this.collections.set('categories', []);
    this.collections.set('vendors', []);
    this.collections.set('products', []);
    this.collections.set('users', []);
    this.collections.set('reviews', []);
    this.collections.set('orders', []);
    this.collections.set('audit_logs', []);

    for (const cat of SEED_CATEGORIES) {
      this.insertOne('categories', { ...cat, _id: this.generateObjectId() });
    }

    for (const vendor of SEED_VENDORS) {
      this.insertOne('vendors', { ...vendor, _id: this.generateObjectId() });
    }

    for (const prod of SEED_PRODUCTS) {
      this.insertOne('products', { ...prod, _id: this.generateObjectId() });
    }

    const defaultHashedPassword = await bcrypt.hash('password123', 10);

    for (const user of SEED_USERS) {
      this.insertOne('users', {
        ...user,
        passwordHash: defaultHashedPassword,
        _id: this.generateObjectId()
      });
    }

    for (const review of SEED_REVIEWS) {
      this.insertOne('reviews', { ...review, _id: this.generateObjectId() });
    }

    const sampleOrderMilestones = [
      { status: 'placed', label: 'Order Placed', description: 'Order #MN-88492 placed successfully.', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), completed: true, current: false },
      { status: 'confirmed', label: 'Confirmed by Seller', description: 'SoundCrafters Pro accepted the order.', timestamp: new Date(Date.now() - 3600000 * 18).toISOString(), completed: true, current: false },
      { status: 'processing', label: 'Packed & Ready', description: 'Package packed in warehouse.', timestamp: new Date(Date.now() - 3600000 * 10).toISOString(), completed: true, current: false },
      { status: 'shipped', label: 'Dispatched via FedEx', description: 'In transit (Tracking: FDX-990218449).', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), completed: true, current: true },
      { status: 'out_for_delivery', label: 'Out for Delivery', description: 'Delivery executive arriving soon.', timestamp: '', completed: false, current: false },
      { status: 'delivered', label: 'Delivered', description: 'Package delivered.', timestamp: '', completed: false, current: false }
    ];

    this.insertOne('orders', {
      _id: this.generateObjectId(),
      id: 'ord_8849201',
      userId: 'u_buyer_demo',
      customerName: 'Aarav Patel',
      customerEmail: 'buyer@marketnexus.io',
      customerPhone: '+91 98765 43210',
      shippingAddress: {
        id: 'addr_1',
        fullName: 'Aarav Patel',
        phone: '+91 98765 43210',
        street: 'Flat 402, Skyline Residency, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560038'
      },
      items: [
        {
          productId: 'prod_wh1000xm5',
          title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
          price: 29990,
          quantity: 1,
          selectedColor: 'Midnight Black',
          thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          vendorId: 'v_soundcrafters',
          vendorName: 'SoundCrafters Pro'
        }
      ],
      subOrders: [
        {
          vendorId: 'v_soundcrafters',
          vendorName: 'SoundCrafters Pro',
          items: [
            {
              productId: 'prod_wh1000xm5',
              title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
              price: 29990,
              quantity: 1,
              selectedColor: 'Midnight Black',
              thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
              vendorId: 'v_soundcrafters',
              vendorName: 'SoundCrafters Pro'
            }
          ],
          subtotal: 29990,
          shippingFee: 0,
          status: 'shipped',
          trackingNumber: 'FDX-990218449',
          courier: 'FedEx Express Air',
          estimatedDelivery: new Date(Date.now() + 3600000 * 20).toISOString(),
          milestones: sampleOrderMilestones
        }
      ],
      subtotal: 29990,
      tax: 5398.2,
      shippingTotal: 0,
      discount: 0,
      totalAmount: 35388.2,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      status: 'shipped',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      overallTrackingNumber: 'FDX-990218449'
    });

    this.insertOne('audit_logs', {
      _id: this.generateObjectId(),
      action: 'SYSTEM_BOOT',
      details: 'MongoDB Database initialized with default schemas.',
      timestamp: new Date().toISOString(),
      performedBy: 'system'
    });

    this.isInitialized = true;
    this.saveToDisk();

    if (this.mongoDb) {
      await this.syncAllToMongo();
    }
  }

  private async syncAllToMongo() {
    if (!this.mongoDb) return;
    try {
      for (const [collName, docs] of this.collections.entries()) {
        if (docs.length > 0) {
          const coll = this.mongoDb.collection(collName);
          await coll.deleteMany({});
          await coll.insertMany(docs as any);
        }
      }
      console.log('✨ Synced all collections into real MongoDB database');
    } catch (err) {
      console.error('Error syncing data to MongoDB:', err);
    }
  }

  /** Product reads and writes use MongoDB directly whenever it is available. */
  public async listCatalogProducts(filter: Record<string, any>, sort: Record<string, 1 | -1>, page: number, limit: number) {
    await this.ready();
    if (this.mongoDb) {
      const collection = this.mongoDb.collection<any>('products');
      const [products, total] = await Promise.all([
        collection.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).toArray(),
        collection.countDocuments(filter),
      ]);
      return { products: products as MongoDocument[], total, source: 'mongodb' as const };
    }
    if (process.env.NODE_ENV === 'production') throw new Error('MongoDB is unavailable; JSON fallback is disabled in production.');
    const all = this.find('products', filter, { sort });
    return { products: all.slice((page - 1) * limit, page * limit), total: all.length, source: 'local-json' as const };
  }

  public async listCatalogFacetProducts(filter: Record<string, any>): Promise<MongoDocument[]> {
    await this.ready();
    if (this.mongoDb) return await this.mongoDb.collection<any>('products').find(filter).project({ brand: 1, category: 1, categoryName: 1, vendorId: 1, vendorName: 1, price: 1 }).toArray() as MongoDocument[];
    if (process.env.NODE_ENV === 'production') throw new Error('MongoDB is unavailable; JSON fallback is disabled in production.');
    return this.find('products', filter);
  }

  public async listCatalogCategories(): Promise<MongoDocument[]> {
    await this.ready();
    if (this.mongoDb) return await this.mongoDb.collection<any>('categories').find({}).toArray() as MongoDocument[];
    if (process.env.NODE_ENV === 'production') throw new Error('MongoDB is unavailable; JSON fallback is disabled in production.');
    return this.find('categories', {});
  }

  public async findCatalogProduct(id: string): Promise<MongoDocument | null> {
    await this.ready();
    if (this.mongoDb) return await this.mongoDb.collection<any>('products').findOne({ $or: [{ id }, { _id: id }] }) as MongoDocument | null;
    if (process.env.NODE_ENV === 'production') throw new Error('MongoDB is unavailable; JSON fallback is disabled in production.');
    return this.findById('products', id);
  }

  public async findVendor(id: string): Promise<MongoDocument | null> {
    await this.ready();
    if (this.mongoDb) return await this.mongoDb.collection<any>('vendors').findOne({ $or: [{ id }, { _id: id }] }) as MongoDocument | null;
    if (process.env.NODE_ENV === 'production') throw new Error('MongoDB is unavailable; JSON fallback is disabled in production.');
    return this.findById('vendors', id);
  }

  public async insertCatalogProduct(doc: Record<string, any>): Promise<MongoDocument> {
    await this.ready();
    const normalized = this.normalizeCatalogProduct(doc);
    if (this.mongoDb) {
      await this.mongoDb.collection<any>('products').insertOne(normalized);
      return normalized;
    }
    if (process.env.NODE_ENV === 'production') throw new Error('MongoDB is unavailable; JSON fallback is disabled in production.');
    return this.insertOne('products', normalized);
  }

  public async updateCatalogProduct(id: string, update: Record<string, any>): Promise<MongoDocument | null> {
    await this.ready();
    const safeUpdate: Record<string, any> = { ...update, updatedAt: new Date().toISOString() };
    delete safeUpdate.id; delete safeUpdate._id; delete safeUpdate.vendorId; delete safeUpdate.vendorName;
    if (this.mongoDb) return await this.mongoDb.collection<any>('products').findOneAndUpdate({ $or: [{ id }, { _id: id }] }, { $set: safeUpdate }, { returnDocument: 'after' }) as MongoDocument | null;
    if (process.env.NODE_ENV === 'production') throw new Error('MongoDB is unavailable; JSON fallback is disabled in production.');
    return this.updateOne('products', { id }, safeUpdate).doc;
  }

  public async deleteCatalogProduct(id: string): Promise<boolean> {
    await this.ready();
    if (this.mongoDb) return (await this.mongoDb.collection<any>('products').deleteOne({ $or: [{ id }, { _id: id }] })).deletedCount === 1;
    if (process.env.NODE_ENV === 'production') throw new Error('MongoDB is unavailable; JSON fallback is disabled in production.');
    return this.deleteOne('products', { id }).deletedCount === 1;
  }

  public normalizeCatalogProduct(doc: Record<string, any>): MongoDocument {
    const now = new Date().toISOString();
    const id = doc.id || `prod_${crypto.randomBytes(6).toString('hex')}`;
    const title = String(doc.title || '').trim();
    const slug = String(doc.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || id);
    const imageUrls = Array.isArray(doc.images) && doc.images.length ? doc.images : (doc.thumbnail ? [doc.thumbnail] : []);
    const media = Array.isArray(doc.media) && doc.media.length ? doc.media : imageUrls.map((url: string, index: number) => ({ id: `media_${id}_${index + 1}`, publicId: '', url, secureUrl: url, format: 'webp', width: 0, height: 0, bytes: 0, version: 1, role: index === 0 ? 'primary' : 'gallery', altText: title, position: index }));
    const primary = media.find((entry: any) => entry.role === 'primary') || media[0];
    return { ...doc, _id: doc._id || this.generateObjectId(), id, title, slug, status: doc.status || 'published', media, images: media.map((entry: any) => entry.secureUrl || entry.url).filter(Boolean), thumbnail: primary?.secureUrl || primary?.url || doc.thumbnail || '', attributes: doc.attributes || {}, ai: doc.ai || { moderationStatus: 'not_run' }, createdAt: doc.createdAt || now, updatedAt: now };
  }

  private saveToDisk() {
    try {
      const obj: Record<string, MongoDocument[]> = {};
      for (const [key, val] of this.collections.entries()) {
        obj[key] = val;
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  public generateObjectId(): string {
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16).padStart(8, '0');
    const machineId = crypto.randomBytes(3).toString('hex');
    const processId = crypto.randomBytes(2).toString('hex');
    const counter = crypto.randomBytes(3).toString('hex');
    return `${timestamp}${machineId}${processId}${counter}`;
  }

  public getCollectionNames(): string[] {
    return Array.from(this.collections.keys());
  }

  public getCollectionStats(): CollectionStats[] {
    const stats: CollectionStats[] = [];
    for (const [name, docs] of this.collections.entries()) {
      const jsonStr = JSON.stringify(docs);
      stats.push({
        name,
        count: docs.length,
        sizeBytes: Buffer.byteLength(jsonStr, 'utf8'),
        indexes: ['_id_', 'createdAt_-1']
      });
    }
    return stats;
  }

  public find(collectionName: string, query: Record<string, any> = {}, options: { sort?: Record<string, 1 | -1>; limit?: number; skip?: number } = {}): MongoDocument[] {
    const coll = this.collections.get(collectionName) || [];
    let results = coll.filter(doc => this.matchesQuery(doc, query));

    if (options.sort) {
      results = this.sortDocuments(results, options.sort);
    }

    const skip = options.skip || 0;
    const limit = options.limit !== undefined ? options.limit : results.length;
    return results.slice(skip, skip + limit);
  }

  public findOne(collectionName: string, query: Record<string, any> = {}): MongoDocument | null {
    const results = this.find(collectionName, query, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  public findById(collectionName: string, id: string): MongoDocument | null {
    const coll = this.collections.get(collectionName) || [];
    return coll.find(doc => doc._id === id || doc.id === id) || null;
  }

  public insertOne(collectionName: string, doc: Record<string, any>): MongoDocument {
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, []);
    }
    const coll = this.collections.get(collectionName)!;
    const newDoc: MongoDocument = {
      _id: doc._id || this.generateObjectId(),
      id: doc.id || doc._id || this.generateObjectId(),
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    coll.unshift(newDoc);
    this.saveToDisk();

    if (this.mongoDb) {
      this.mongoDb.collection(collectionName).insertOne({ ...newDoc } as any).catch(err => {
        console.error(`MongoDB insertOne error on ${collectionName}:`, err);
      });
    }

    return newDoc;
  }

  public updateOne(collectionName: string, query: Record<string, any>, update: Record<string, any>): { matchedCount: number; modifiedCount: number; doc: MongoDocument | null } {
    const doc = this.findOne(collectionName, query);
    if (!doc) {
      return { matchedCount: 0, modifiedCount: 0, doc: null };
    }

    const setObj = update.$set ? update.$set : update;
    Object.assign(doc, setObj, { updatedAt: new Date().toISOString() });
    this.saveToDisk();

    if (this.mongoDb) {
      const mongoQuery = doc._id ? { _id: doc._id } : query;
      this.mongoDb.collection(collectionName).updateOne(mongoQuery, { $set: setObj }).catch(err => {
        console.error(`MongoDB updateOne error on ${collectionName}:`, err);
      });
    }

    return { matchedCount: 1, modifiedCount: 1, doc };
  }

  public deleteOne(collectionName: string, query: Record<string, any>): { deletedCount: number } {
    const coll = this.collections.get(collectionName) || [];
    const index = coll.findIndex(doc => this.matchesQuery(doc, query));
    if (index !== -1) {
      const docToDelete = coll[index];
      coll.splice(index, 1);
      this.saveToDisk();

      if (this.mongoDb) {
        const mongoQuery = docToDelete._id ? { _id: docToDelete._id } : query;
        this.mongoDb.collection(collectionName).deleteOne(mongoQuery).catch(err => {
          console.error(`MongoDB deleteOne error on ${collectionName}:`, err);
        });
      }

      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  public countDocuments(collectionName: string, query: Record<string, any> = {}): number {
    const coll = this.collections.get(collectionName) || [];
    return coll.filter(doc => this.matchesQuery(doc, query)).length;
  }

  private matchesQuery(doc: MongoDocument, query: Record<string, any>): boolean {
    for (const key of Object.keys(query)) {
      const condition = query[key];

      if (key === '$or' && Array.isArray(condition)) {
        const matchAny = condition.some(subQuery => this.matchesQuery(doc, subQuery));
        if (!matchAny) return false;
        continue;
      }

      if (key === '$and' && Array.isArray(condition)) {
        const matchAll = condition.every(subQuery => this.matchesQuery(doc, subQuery));
        if (!matchAll) return false;
        continue;
      }

      const docVal = this.getNestedValue(doc, key);

      if (typeof condition === 'object' && condition !== null && !Array.isArray(condition)) {
        for (const op of Object.keys(condition)) {
          const targetVal = condition[op];
          if (op === '$eq' && docVal !== targetVal) return false;
          if (op === '$ne' && docVal === targetVal) return false;
          if (op === '$gt' && !(docVal > targetVal)) return false;
          if (op === '$gte' && !(docVal >= targetVal)) return false;
          if (op === '$lt' && !(docVal < targetVal)) return false;
          if (op === '$lte' && !(docVal <= targetVal)) return false;
          if (op === '$in' && Array.isArray(targetVal) && !targetVal.includes(docVal)) return false;
          if (op === '$nin' && Array.isArray(targetVal) && targetVal.includes(docVal)) return false;
          if (op === '$regex') {
            const regex = new RegExp(targetVal, condition.$options || 'i');
            if (!regex.test(String(docVal || ''))) return false;
          }
        }
      } else {
        if (docVal !== condition && doc.id !== condition && doc._id !== condition) {
          if (key === 'id' && (doc.id === condition || doc._id === condition)) {
            continue;
          }
          if (key === '_id' && (doc._id === condition || doc.id === condition)) {
            continue;
          }
          return false;
        }
      }
    }
    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((prev, curr) => (prev && prev[curr] !== undefined ? prev[curr] : undefined), obj);
  }

  private sortDocuments(docs: MongoDocument[], sort: Record<string, 1 | -1>): MongoDocument[] {
    return [...docs].sort((a, b) => {
      for (const [key, direction] of Object.entries(sort)) {
        const valA = this.getNestedValue(a, key);
        const valB = this.getNestedValue(b, key);
        if (valA === valB) continue;
        if (valA > valB || valA !== undefined && valB === undefined) {
          return direction === 1 ? 1 : -1;
        }
        if (valA < valB || valA === undefined && valB !== undefined) {
          return direction === 1 ? -1 : 1;
        }
      }
      return 0;
    });
  }
}

export const db = new MongoDatabase();
