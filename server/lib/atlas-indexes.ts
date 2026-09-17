import type { Collection, CreateIndexesOptions, Db, Document, IndexDescription } from 'mongodb';

export type AtlasIndexDirection = -1 | 1 | 'text' | 'hashed' | '2d' | '2dsphere' | number;

export interface OrdinaryIndexDefinition {
  collection: string;
  name: string;
  key: Record<string, AtlasIndexDirection>;
  unique?: boolean;
  sparse?: boolean;
  partialFilterExpression?: Document;
}

export interface TextIndexDefinition {
  collection: string;
  name: string;
  key: Record<string, 'text'>;
  defaultLanguage?: string;
}

export interface TtlIndexDefinition {
  collection: string;
  name: string;
  key: Record<string, 1 | -1>;
  expireAfterSeconds: number;
}

export interface VectorSearchField {
  type: 'vector';
  path: string;
  numDimensions: number;
  similarity: 'cosine' | 'euclidean' | 'dotProduct';
}

export interface VectorFilterField {
  type: 'filter';
  path: string;
}

export interface VectorIndexDefinition {
  collection: string;
  name: string;
  definition: {
    fields: Array<VectorSearchField | VectorFilterField>;
  };
}

export interface AtlasIndexPlan {
  ordinary: OrdinaryIndexDefinition[];
  text: TextIndexDefinition[];
  ttl: TtlIndexDefinition[];
  vector: VectorIndexDefinition[];
}

export interface IndexRunSummary {
  attempted: number;
  created: number;
  existing: number;
  warnings: string[];
}

export interface AtlasIndexRunResult {
  ordinary: IndexRunSummary;
  text: IndexRunSummary;
  ttl: IndexRunSummary;
  vector: IndexRunSummary;
  warnings: string[];
}

export function ordinaryIndex(
  collection: string,
  name: string,
  key: Record<string, AtlasIndexDirection>,
  options: Pick<OrdinaryIndexDefinition, 'unique' | 'sparse' | 'partialFilterExpression'> = {}
): OrdinaryIndexDefinition {
  return { collection, name, key, ...options };
}

export function textIndex(collection: string, name: string, key: Record<string, 'text'>): TextIndexDefinition {
  return { collection, name, key };
}

export function ttlIndex(collection: string, name: string, path: string, expireAfterSeconds: number): TtlIndexDefinition {
  return { collection, name, key: { [path]: 1 }, expireAfterSeconds };
}

export function vectorSearchIndex(
  name: string,
  numDimensions: number,
  filterPaths: string[] = ['productId', 'mediaId', 'status', 'category']
): VectorIndexDefinition {
  return {
    collection: 'product_image_embeddings',
    name,
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions,
          similarity: 'cosine'
        },
        ...filterPaths.map(path => ({ type: 'filter' as const, path }))
      ]
    }
  };
}

export function createAtlasIndexPlan(vectorDimensions = 768, eventTtlSeconds = 90 * 24 * 60 * 60): AtlasIndexPlan {
  return {
    ordinary: [
      ordinaryIndex('categories', 'categories_id_unique', { id: 1 }, { unique: true }),
      ordinaryIndex('categories', 'categories_slug_unique', { slug: 1 }, { unique: true }),
      ordinaryIndex('vendors', 'vendors_id_unique', { id: 1 }, { unique: true }),
      ordinaryIndex('vendors', 'vendors_email', { email: 1 }),
      ordinaryIndex('products', 'products_id_unique', { id: 1 }, { unique: true }),
      ordinaryIndex('products', 'products_slug_unique', { slug: 1 }, { unique: true }),
      ordinaryIndex('products', 'products_status_category', { status: 1, category: 1 }),
      ordinaryIndex('products', 'products_status_brand', { status: 1, brand: 1 }),
      ordinaryIndex('products', 'products_status_vendor', { status: 1, vendorId: 1 }),
      ordinaryIndex('products', 'products_status_created', { status: 1, createdAt: -1 }),
      ordinaryIndex('products', 'products_price', { price: 1 }),
      ordinaryIndex('products', 'products_rating', { rating: -1 }),
      ordinaryIndex('products', 'products_stock', { stock: 1 }),
      ordinaryIndex('products', 'products_featured', { isFeatured: 1 }),
      ordinaryIndex('products', 'products_category', { category: 1 }),
      ordinaryIndex('products', 'products_vendor', { vendorId: 1 }),
      ordinaryIndex('users', 'users_id_unique', { id: 1 }, { unique: true }),
      ordinaryIndex('users', 'users_email', { email: 1 }),
      ordinaryIndex('reviews', 'reviews_id_unique', { id: 1 }, { unique: true }),
      ordinaryIndex('reviews', 'reviews_product', { productId: 1 }),
      ordinaryIndex('reviews', 'reviews_user', { userId: 1 }),
      ordinaryIndex('orders', 'orders_id_unique', { id: 1 }, { unique: true }),
      ordinaryIndex('orders', 'orders_user_created', { userId: 1, createdAt: -1 }),
      ordinaryIndex('orders', 'orders_created', { createdAt: -1 }),
      ordinaryIndex('audit_logs', 'audit_logs_id_unique', { id: 1 }, { unique: true }),
      ordinaryIndex('audit_logs', 'audit_logs_created', { createdAt: -1 }),
      ordinaryIndex('product_image_embeddings', 'product_image_embeddings_product_media_unique', { productId: 1, mediaId: 1 }, { unique: true }),
      ordinaryIndex('product_image_embeddings', 'product_image_embeddings_product', { productId: 1 }),
      ordinaryIndex('product_image_embeddings', 'product_image_embeddings_model', { model: 1 }),
      ordinaryIndex('product_image_embeddings', 'product_image_embeddings_created', { createdAt: -1 }),
      ordinaryIndex('product_events', 'product_events_session', { sessionId: 1 }),
      ordinaryIndex('product_events', 'product_events_type', { eventType: 1 }),
      ordinaryIndex('product_events', 'product_events_occurred', { occurredAt: -1 }),
      ordinaryIndex('recommendation_cache', 'recommendation_cache_subject', { subjectType: 1, subjectId: 1 }),
      ordinaryIndex('recommendation_cache', 'recommendation_cache_expires', { expiresAt: 1 })
    ],
    text: [
      textIndex('products', 'products_search_text', {
        title: 'text',
        description: 'text',
        brand: 'text',
        tags: 'text',
        attributes: 'text'
      })
    ],
    ttl: [
      ttlIndex('product_events', 'product_events_occurred_ttl', 'occurredAt', eventTtlSeconds)
    ],
    vector: [
      vectorSearchIndex('product_image_embeddings_vector', vectorDimensions)
    ]
  };
}

export async function ensureAtlasIndexes(db: Db, plan: AtlasIndexPlan): Promise<AtlasIndexRunResult> {
  const ordinary: IndexRunSummary = emptySummary(plan.ordinary.length);
  const text: IndexRunSummary = emptySummary(plan.text.length);
  const ttl: IndexRunSummary = emptySummary(plan.ttl.length);
  const vector: IndexRunSummary = emptySummary(plan.vector.length);

  for (const definition of plan.ordinary) {
    await ensureOrdinaryIndex(db.collection(definition.collection), definition, ordinary);
  }
  for (const definition of plan.text) {
    await ensureTextIndex(db.collection(definition.collection), definition, text);
  }
  for (const definition of plan.ttl) {
    await ensureTtlIndex(db.collection(definition.collection), definition, ttl);
  }
  for (const definition of plan.vector) {
    await ensureVectorIndex(db.collection(definition.collection), definition, vector);
  }

  return {
    ordinary,
    text,
    ttl,
    vector,
    warnings: [...ordinary.warnings, ...text.warnings, ...ttl.warnings, ...vector.warnings]
  };
}

function emptySummary(attempted: number): IndexRunSummary {
  return { attempted, created: 0, existing: 0, warnings: [] };
}

async function ensureOrdinaryIndex(
  collection: Collection,
  definition: OrdinaryIndexDefinition,
  summary: IndexRunSummary
): Promise<void> {
  const existingIndexes = await listIndexes(collection);
  const existing = existingIndexes.find(index => index.name === definition.name);

  if (existing) {
    if (!sameKey(existing.key, definition.key)) {
      summary.warnings.push(`${definition.name} already exists with a different key`);
    }
    summary.existing += 1;
    return;
  }

  try {
    await collection.createIndex(definition.key as IndexDescription['key'], indexOptions(definition));
    summary.created += 1;
  } catch (error) {
    const currentIndexes = await listIndexes(collection);
    if (currentIndexes.some(index => index.name === definition.name)) {
      summary.existing += 1;
      return;
    }
    summary.warnings.push(`${definition.name} could not be created (${errorCode(error)})`);
  }
}

async function ensureTextIndex(
  collection: Collection,
  definition: TextIndexDefinition,
  summary: IndexRunSummary
): Promise<void> {
  const existingIndexes = await listIndexes(collection);
  const existing = existingIndexes.find(index => index.name === definition.name);

  if (existing) {
    if (!sameKey(existing.key, definition.key)) {
      summary.warnings.push(`${definition.name} already exists with a different key`);
    }
    summary.existing += 1;
    return;
  }

  if (existingIndexes.some(index => Object.values(index.key).some(value => value === 'text'))) {
    summary.warnings.push(`${definition.name} was not created because another text index exists`);
    summary.existing += 1;
    return;
  }

  try {
    const options: CreateIndexesOptions = { name: definition.name };
    if (definition.defaultLanguage) options.default_language = definition.defaultLanguage;
    await collection.createIndex(definition.key as IndexDescription['key'], options);
    summary.created += 1;
  } catch (error) {
    const currentIndexes = await listIndexes(collection);
    if (currentIndexes.some(index => index.name === definition.name)) {
      summary.existing += 1;
      return;
    }
    summary.warnings.push(`${definition.name} could not be created (${errorCode(error)})`);
  }
}

async function ensureTtlIndex(
  collection: Collection,
  definition: TtlIndexDefinition,
  summary: IndexRunSummary
): Promise<void> {
  const existingIndexes = await listIndexes(collection);
  const existing = existingIndexes.find(index => index.name === definition.name);

  if (existing) {
    if (existing.expireAfterSeconds !== definition.expireAfterSeconds || !sameKey(existing.key, definition.key)) {
      summary.warnings.push(`${definition.name} already exists with different options`);
    }
    summary.existing += 1;
    return;
  }

  try {
    await collection.createIndex(definition.key as IndexDescription['key'], { name: definition.name, expireAfterSeconds: definition.expireAfterSeconds });
    summary.created += 1;
  } catch (error) {
    const currentIndexes = await listIndexes(collection);
    if (currentIndexes.some(index => index.name === definition.name)) {
      summary.existing += 1;
      return;
    }
    summary.warnings.push(`${definition.name} could not be created (${errorCode(error)})`);
  }
}

async function ensureVectorIndex(
  collection: Collection,
  definition: VectorIndexDefinition,
  summary: IndexRunSummary
): Promise<void> {
  const existingIndexes = await listSearchIndexes(collection);
  const existing = existingIndexes.find(index => index.name === definition.name);

  if (existing) {
    if (!sameDocument(existing.definition, definition.definition)) {
      summary.warnings.push(`${definition.name} already exists with a different definition`);
    }
    summary.existing += 1;
    return;
  }

  try {
    await collection.createSearchIndex({
      name: definition.name,
      type: 'vectorSearch',
      definition: definition.definition
    });
    summary.created += 1;
  } catch (error) {
    summary.warnings.push(`${definition.name} could not be created (${errorCode(error)})`);
  }
}

async function listIndexes(collection: Collection): Promise<any[]> {
  try {
    return await collection.indexes();
  } catch {
    return [];
  }
}

async function listSearchIndexes(collection: Collection): Promise<any[]> {
  try {
    return await collection.listSearchIndexes().toArray();
  } catch {
    return [];
  }
}

function indexOptions(definition: OrdinaryIndexDefinition): CreateIndexesOptions {
  const options: CreateIndexesOptions = { name: definition.name };
  if (definition.unique !== undefined) options.unique = definition.unique;
  if (definition.sparse !== undefined) options.sparse = definition.sparse;
  if (definition.partialFilterExpression !== undefined) options.partialFilterExpression = definition.partialFilterExpression;
  return options;
}

function sameKey(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
  return stableStringify(left) === stableStringify(right);
}

function sameDocument(left: Document, right: Document): boolean {
  return stableStringify(left) === stableStringify(right);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'number' || typeof code === 'string') {
      return String(code);
    }
  }
  return error instanceof Error ? error.name : 'unknown error';
}
