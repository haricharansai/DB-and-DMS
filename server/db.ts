import crypto from 'crypto';
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_VENDORS, SEED_USERS, SEED_REVIEWS } from '../src/data/seedData';
import bcrypt from 'bcryptjs';

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

  constructor() {
    this.init();
  }

  public async init() {
    if (this.isInitialized) return;

    // Initialize collections
    this.collections.set('categories', []);
    this.collections.set('vendors', []);
    this.collections.set('products', []);
    this.collections.set('users', []);
    this.collections.set('reviews', []);
    this.collections.set('orders', []);
    this.collections.set('audit_logs', []);

    // Seed Categories
    for (const cat of SEED_CATEGORIES) {
      this.insertOne('categories', { ...cat, _id: this.generateObjectId() });
    }

    // Seed Vendors
    for (const vendor of SEED_VENDORS) {
      this.insertOne('vendors', { ...vendor, _id: this.generateObjectId() });
    }

    // Seed Products
    for (const prod of SEED_PRODUCTS) {
      this.insertOne('products', { ...prod, _id: this.generateObjectId() });
    }

    // Hash demo passwords
    const defaultHashedPassword = await bcrypt.hash('password123', 10);

    // Seed Users
    for (const user of SEED_USERS) {
      this.insertOne('users', {
        ...user,
        passwordHash: defaultHashedPassword,
        _id: this.generateObjectId()
      });
    }

    // Seed Reviews
    for (const review of SEED_REVIEWS) {
      this.insertOne('reviews', { ...review, _id: this.generateObjectId() });
    }

    // Seed Sample Initial Order
    const sampleOrderMilestones = [
      { status: 'placed', label: 'Order Placed', description: 'Order #MN-88492 placed successfully with online payment verification.', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), completed: true, current: false },
      { status: 'confirmed', label: 'Confirmed by Seller', description: 'SoundCrafters Pro accepted the order and allocated stock inventory.', timestamp: new Date(Date.now() - 3600000 * 18).toISOString(), completed: true, current: false },
      { status: 'processing', label: 'Packed & Ready', description: 'Package packed with multi-layer tamper-evident seal in Bengaluru warehouse.', timestamp: new Date(Date.now() - 3600000 * 10).toISOString(), completed: true, current: false },
      { status: 'shipped', label: 'Dispatched via FedEx', description: 'In transit to Regional Hub (Tracking: FDX-990218449).', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), completed: true, current: true },
      { status: 'out_for_delivery', label: 'Out for Delivery', description: 'Delivery executive will reach before 7:00 PM.', timestamp: '', completed: false, current: false },
      { status: 'delivered', label: 'Delivered', description: 'Package handed over with OTP verification.', timestamp: '', completed: false, current: false }
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
        street: 'Flat 402, Skyline Residency, 100 Feet Rd, Indiranagar',
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

    // Seed Audit Log
    this.insertOne('audit_logs', {
      _id: this.generateObjectId(),
      action: 'SYSTEM_BOOT',
      details: 'MongoDB Database initialized with default schemas and indices.',
      timestamp: new Date().toISOString(),
      performedBy: 'system'
    });

    this.isInitialized = true;
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
    return newDoc;
  }

  public updateOne(collectionName: string, query: Record<string, any>, update: Record<string, any>): { matchedCount: number; modifiedCount: number; doc: MongoDocument | null } {
    const doc = this.findOne(collectionName, query);
    if (!doc) {
      return { matchedCount: 0, modifiedCount: 0, doc: null };
    }

    const setObj = update.$set ? update.$set : update;
    Object.assign(doc, setObj, { updatedAt: new Date().toISOString() });

    return { matchedCount: 1, modifiedCount: 1, doc };
  }

  public deleteOne(collectionName: string, query: Record<string, any>): { deletedCount: number } {
    const coll = this.collections.get(collectionName) || [];
    const index = coll.findIndex(doc => this.matchesQuery(doc, query));
    if (index !== -1) {
      coll.splice(index, 1);
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
