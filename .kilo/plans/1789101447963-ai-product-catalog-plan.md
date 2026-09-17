# AI Product Catalog Implementation Plan

## 1. Scope and decisions

### Phase 1 — AI-assisted marketplace catalog
- Server-side Gemini integration for:
  - natural-language/semantic product search;
  - AI-assisted product listing generation;
  - hybrid personalized recommendations with explanations.
- Structured product data and vendor-owned product management.
- Multi-image product media using Cloudinary and CDN delivery.
- MongoDB Atlas as the primary database, managed and inspected through MongoDB Compass.
- Existing embedded JSON database remains only as a local development fallback.

### Phase 2 — visual search
- Upload or select a query image.
- Generate an image embedding with a supported Gemini multimodal embedding model.
- Search product image embeddings with MongoDB Atlas Vector Search.
- Combine visual similarity with catalog filters and deterministic ranking.
- Provide an attribute-based or exact-similarity fallback when Atlas Vector Search is unavailable.

### Decisions already made
- **Recommendation strategy:** deterministic candidate generation first, then Gemini-assisted reranking and explanations.
- **Product model:** product-level pricing, stock, colors, and media in Phase 1; defer full SKU/variant inventory.
- **Image storage:** Cloudinary with responsive transformations and CDN delivery.
- **Backend:** MongoDB Atlas + MongoDB Compass. Compass is the administration client; Atlas is the actual database.
- **Privacy default for this plan:** collect only minimal behavioral events needed for recommendations, with an anonymous session fallback, opt-out, retention limits, and no sensitive data sent to Gemini.

## 2. Current codebase findings and constraints

- `server/routes.ts:196` currently loads and filters the full product collection in memory. The new catalog must use server-side pagination and filtering.
- `server/routes.ts:280` currently creates products from a flat request body and accepts image URLs directly. It has no media validation, upload workflow, status, ownership enforcement, or AI draft review.
- `src/components/vendor/VendorDashboard.tsx:69` currently supports one image URL and a limited form. It must become a multi-image listing workflow.
- `src/components/catalog/CatalogView.tsx:28` currently receives the full product list and performs most filtering in the browser.
- `src/components/product/ProductDetailView.tsx:30` already has an image gallery, but it needs responsive media, lazy loading, fallbacks, accessibility metadata, and a shared media contract.
- `src/types/index.ts:77` has a flat `Product` type with `images: string[]`, `thumbnail`, and free-form `specs`.
- `server/db.ts:23` wraps MongoDB documents in a process-local `Map` and also uses `server/db_data.json` as a fallback. It is not yet a direct, durable Atlas repository. In particular, updates and deletes are persisted to disk but are not consistently written back to the connected MongoDB collection.
- `@google/genai` is installed, but no application code currently uses it.
- `GEMINI_API_KEY` is present in `.env`; it must remain server-side only. Do not import `.env` into React or expose the key through an API response.

## 3. Target architecture

```text
React UI
  |
  | /api/products, /api/media/*, /api/ai/*, /api/events
  v
Express server (server.ts / server/routes.ts)
  |
  +-- ProductService
  +-- MediaService -> Cloudinary
  +-- GeminiService -> Gemini API
  +-- RecommendationService
  +-- EventService
  +-- VectorSearchService (Phase 2)
  |
  v
MongoDB Atlas
  |
  +-- Compass for inspection, indexes, data fixes, and vector-index management
```

Recommended backend modules:

- `server/services/gemini.ts`
- `server/services/cloudinary.ts`
- `server/services/product-service.ts`
- `server/services/recommendation-service.ts`
- `server/services/event-service.ts`
- `server/services/vector-search.ts` (Phase 2)
- `server/repositories/mongo-product-repository.ts`

The repository layer should use the MongoDB Node driver directly for Atlas operations. Do not continue relying on the current process-local map for the production path.

## 4. Database design

### 4.1 `products`

Keep the existing public fields for compatibility, but make media and structured attributes canonical.

```ts
{
  _id: ObjectId;
  id: string;                 // stable public ID, unique
  slug: string;               // unique, URL-safe
  title: string;
  description: string;
  price: number;              // integer paisa or documented INR minor units
  originalPrice: number;
  discountPercentage: number;
  category: string;           // category slug
  brand: string;
  vendorId: string;
  vendorName: string;

  status: 'draft' | 'pending_review' | 'published' | 'archived';
  stock: number;
  colors: string[];

  media: ProductMedia[];      // canonical image collection
  thumbnail: string;          // derived/legacy primary URL
  images: string[];           // derived/legacy URL list during migration

  attributes: Record<string, string | number | boolean>;
  specs: Record<string, string>; // retain for existing UI/data compatibility
  tags: string[];

  isFeatured: boolean;
  isTrending: boolean;
  isFlashDeal: boolean;
  dealEndsAt?: string;

  ai: {
    descriptionSource?: 'vendor' | 'gemini';
    attributesSource?: 'vendor' | 'gemini';
    moderationStatus?: 'not_run' | 'approved' | 'needs_review' | 'rejected';
    attributeConfidence?: number;
    lastAiRunAt?: string;
  };

  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
```

`ProductMedia` should contain:

```ts
{
  id: string;
  publicId: string;
  url: string;
  secureUrl: string;
  format: 'jpg' | 'png' | 'webp' | 'avif';
  width: number;
  height: number;
  bytes: number;
  version: number;
  role: 'primary' | 'gallery' | 'swatch' | 'lifestyle';
  altText: string;
  position: number;
}
```

Do not store Base64 image data in MongoDB.

### 4.2 Supporting collections

#### `product_image_embeddings` — Phase 2

```ts
{
  _id: ObjectId;
  productId: string;
  mediaId: string;
  model: string;
  dimensions: number;
  embedding: number[];
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
}
```

Use one record per image that should participate in visual search. Keep the product document as the source of truth and delete/rebuild embeddings when media changes.

#### `product_events`

```ts
{
  _id: ObjectId;
  userId?: string;
  anonymousId?: string;
  sessionId: string;
  eventType: 'product_view' | 'search' | 'add_to_cart' | 'wishlist' | 'purchase';
  productId?: string;
  query?: string;
  metadata?: Record<string, string | number | boolean>;
  occurredAt: string;
  consentVersion?: string;
}
```

Add a TTL index on `occurredAt`. Never store passwords, full addresses, payment details, KYC documents, or raw vendor form data in this collection.

#### `recommendation_cache`

```ts
{
  _id: ObjectId;
  subjectType: 'user' | 'anonymous';
  subjectId: string;
  context: 'home' | 'catalog' | 'product_detail' | 'cart';
  productIds: string[];
  reasons: Record<string, string>;
  expiresAt: string;
  createdAt: string;
}
```

#### Existing collections

Retain `categories`, `vendors`, `users`, `reviews`, `orders`, and `audit_logs`. Add indexes rather than duplicating product data into those collections.

### 4.3 Indexes

Create and verify in Atlas/Compass:

- unique indexes on `products.id` and `products.slug`;
- compound indexes for `status + category`, `status + brand`, `status + vendorId`, and `status + createdAt`;
- indexes for `price`, `rating`, `stock`, and `isFeatured`;
- a text index over `title`, `description`, `brand`, `tags`, and selected `attributes`;
- a unique index on `product_image_embeddings.productId + mediaId`;
- an Atlas Vector Search index on `product_image_embeddings.embedding`, with `productId`, `mediaId`, and product status/category as filters;
- a TTL index on `product_events.occurredAt`.

## 5. Product data and image workflow

### 5.1 Vendor product creation

1. Vendor opens **Add New Product Listing** in `VendorDashboard`.
2. Vendor enters title, brand, category, price, stock, colors, raw description, and raw specifications.
3. Vendor uploads one primary image and zero or more gallery images through a direct Cloudinary upload flow.
4. Frontend sends Cloudinary public IDs, image metadata, and the draft product fields to `POST /api/products`.
5. Backend verifies:
   - authenticated buyer/vendor/admin role;
   - vendor ownership;
   - valid category and numeric ranges;
   - image public IDs and metadata;
   - no unsupported file types or excessive dimensions;
   - required fields and uniqueness of `id`/`slug`.
6. Product is saved as `draft` or `pending_review`, never silently published when AI generated content is involved.
7. Vendor reviews and edits the generated fields before publishing.
8. Publishing creates an audit event and makes the product eligible for catalog queries.

### 5.2 AI-assisted listing draft

Add `POST /api/ai/products/draft` for authenticated vendors/admins.

Input:

```ts
{
  rawTitle?: string;
  rawDescription?: string;
  rawSpecifications?: Record<string, string>;
  category: string;
  brand?: string;
  mediaPublicIds?: string[];
}
```

Gemini returns structured JSON:

```ts
{
  title: string;
  description: string;
  attributes: Record<string, string | number | boolean>;
  tags: string[];
  colors: string[];
  altTextByMediaId: Record<string, string>;
  confidence: number;
  warnings: string[];
}
```

The UI must show these as editable draft fields. Record the AI source and confidence in `products.ai`; never treat generated content as verified factual data without vendor review.

### 5.3 Image delivery

- Use Cloudinary transformations for primary, card, gallery, and thumbnail variants.
- Store canonical metadata and CDN URLs in Atlas.
- Use `loading="lazy"` and `decoding="async"` for catalog images.
- Use eager loading only for the first hero image when justified.
- Set explicit `width`, `height`, and CSS aspect ratio to prevent layout shift.
- Use `object-fit: contain` for product packshots and `object-fit: cover` only for category, vendor, and lifestyle images.
- Provide meaningful `alt` text generated from the vendor/AI draft and editable by the vendor.
- Add a local placeholder/fallback image when a CDN image fails.
- Validate image MIME type, size, dimensions, and aspect ratio before accepting it.
- Add a cleanup job or manual admin operation for orphaned Cloudinary assets after product deletion.

## 6. Product list and detail UI

### 6.1 Shared product card

Create a reusable `ProductCard` component and use it in:

- `HomeView` flash deals and trending sections;
- `CatalogView` grid/list modes;
- recommendation shelves;
- vendor inventory rows where appropriate.

The card should receive a stable `Product` DTO and render:

- primary media;
- discount/featured/trending badges;
- brand, title, rating, review count;
- vendor name and verification state;
- current price and original price;
- stock state;
- cart, wishlist, and comparison actions.

### 6.2 Catalog

Change `GET /api/products` to return a page, not the entire collection:

```json
{
  "success": true,
  "products": [],
  "pagination": {
    "page": 1,
    "limit": 24,
    "total": 120,
    "totalPages": 5
  },
  "facets": {
    "brands": [],
    "categories": [],
    "vendors": [],
    "priceRange": {}
  }
}
```

Support server-side:

- category, brand, vendor, price, rating, stock, deal, and status filters;
- keyword search;
- sort by newest, price, rating, discount, and popularity;
- stable pagination;
- optional AI search mode.

Update `CatalogView` to show skeletons while loading, preserve filters in the URL/hash query, and avoid resetting the page when a filter changes.

### 6.3 Product detail

Extend `ProductDetailView` to use the canonical `media` array:

- primary image and thumbnail strip;
- optional zoom/lightbox;
- image-level alt text;
- responsive Cloudinary URLs;
- loading and error states;
- structured specification/attribute sections;
- vendor box and delivery information;
- related/recommended products below the main product.

Keep `thumbnail` and `images` temporarily for backward compatibility with existing seed data and components, but derive them from `media[0]` and the ordered media list.

## 7. AI features

### 7.1 Gemini service boundaries

Implement a server-only `GeminiService`:

- read `GEMINI_API_KEY` from the server environment;
- use a configurable `GEMINI_MODEL` and, for Phase 2, `GEMINI_EMBEDDING_MODEL`;
- use structured JSON output/schema where supported;
- set timeouts, bounded retries, request-size limits, and rate limits;
- cache deterministic or expensive responses;
- return a safe fallback response when Gemini is unavailable;
- log request IDs and latency, never API keys or raw sensitive payloads.

Never call Gemini from React. The browser should call only same-origin `/api/ai/*` endpoints.

### 7.2 Semantic product search

Add `POST /api/ai/search` (or a search mode on `/api/products`):

1. Normalize the user's natural-language query.
2. Retrieve candidates using Atlas text search and structured filters.
3. Use a text embedding/vector stage when available.
4. Apply hard filters such as published status, stock, category, and price.
5. Rerank candidates with a deterministic score plus Gemini relevance scoring.
6. Return products with short, bounded explanations such as “matches your budget and noise-cancellation requirement.”
7. Fall back to the existing keyword search if Gemini fails.

Do not send the entire catalog to Gemini for every query. Send a bounded candidate set and only the fields needed for ranking.

### 7.3 Personalized recommendations

Add `GET /api/recommendations` with context such as `home`, `catalog`, or `product_detail`.

Candidate generation should use:

- authenticated user's recent views, cart, wishlist, and purchases;
- anonymous session events for guests;
- category, brand, price band, vendor, rating, stock, and popularity;
- cold-start fallback to featured/trending products.

Gemini should rerank a small candidate set and produce concise explanations. It should not be the sole source of truth for availability, price, or ranking rules.

Recommended response:

```json
{
  "success": true,
  "products": [],
  "reasons": {
    "prod_wh1000xm5": "Similar to your recent audio searches and highly rated by verified buyers"
  },
  "fallback": false
}
```

### 7.4 Review and content assistance (optional Phase 1 extension)

- summarize verified reviews into pros/cons;
- detect potentially duplicate or suspicious reviews for admin review;
- generate FAQ answers from product specifications;
- flag missing or contradictory product attributes.

Keep all generated text editable and auditable.

## 8. Phase 2 visual search

1. Add an image-drop/search control to the catalog.
2. Upload the query image through the Cloudinary flow or accept a verified Cloudinary media ID.
3. Validate and normalize the image.
4. Generate an embedding with the configured supported Gemini multimodal embedding model.
5. Query `product_image_embeddings` using Atlas Vector Search.
6. Filter results to published, in-stock products and optionally apply category/price/vendor constraints.
7. Merge vector similarity with text relevance and deterministic business rules.
8. Display “Visually similar products” with the query image, result images, and a fallback message when no close match exists.
9. Rebuild or invalidate embeddings when a product image is added, replaced, reordered, or deleted.

If the Atlas tier or cluster does not support the required vector index, use an exact cosine-similarity fallback for the small demo catalog or temporarily use attribute-based image search. Do not silently send user images to an unapproved third-party service.

## 9. API contract changes

Add or revise:

```text
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

POST   /api/media/upload-signature
POST   /api/ai/products/draft
POST   /api/ai/search
GET    /api/recommendations
POST   /api/events

Phase 2:
POST   /api/ai/visual-search
```

All product-list responses should use a typed DTO and exclude:

- internal `_id` values unless required by admin tooling;
- embeddings;
- AI prompts and raw model responses;
- vendor KYC data;
- private audit metadata.

## 10. Migration and rollout

1. Create an Atlas cluster and connect it through `MONGODB_URI` in `.env`; keep `.env` ignored by Git.
2. Add a migration script that imports the existing `server/db_data.json` and/or `src/data/seedData.ts` records into Atlas while preserving public product IDs.
3. Normalize existing `images` and `thumbnail` values into `media` records with source metadata.
4. Generate slugs and validate duplicate IDs before switching reads to Atlas.
5. Create ordinary indexes first, then text indexes, then the Phase 2 vector index.
6. Add a repository feature flag such as `USE_ATLAS_PRODUCT_REPOSITORY` so reads can be compared against the current implementation during testing.
7. Switch write traffic to Atlas only after counts, product detail, filters, and vendor ownership checks match.
8. Keep `server/db_data.json` as a rollback snapshot, not as the post-migration source of truth.
9. Seed additional demo products through the migration/seed path and `src/data/seedData.ts`; do not manually edit only `db_data.json` after migration.
10. Enable AI search, recommendations, and visual search behind separate feature flags.
11. Keep the embedded database only for local demos where Atlas is intentionally unavailable; production should fail visibly rather than silently lose writes to a JSON fallback.

## 11. Security, privacy, and operations

- Keep `GEMINI_API_KEY`, `JWT_SECRET`, Cloudinary credentials, and Atlas credentials server-side.
- Rotate the current Gemini key if it has been committed, shared, or exposed outside the local secrets store.
- Use least-privilege Cloudinary and Atlas credentials.
- Validate and sanitize all vendor input; never trust client-provided vendor IDs or image URLs.
- Enforce vendor ownership on create, update, delete, and AI-draft endpoints.
- Add request rate limits to AI and upload endpoints.
- Add consent/opt-out handling and a retention window for `product_events`.
- Do not send passwords, payment details, full addresses, KYC documents, or raw authentication tokens to Gemini.
- Use audit logs for AI-assisted product creation, publishing, media changes, and admin overrides.
- Add health checks for Atlas, Cloudinary, and Gemini dependency status without exposing credentials.

## 12. Validation and acceptance criteria

### Backend
- `npm run lint` passes.
- `npm run build` passes.
- Product CRUD works through Atlas and Compass shows the expected collections/documents.
- Pagination and all existing filters return the same results as the old implementation for the seed catalog.
- Vendor A cannot update or delete Vendor B's product.
- Invalid prices, categories, media IDs, and missing required fields return controlled 4xx responses.
- Gemini and Cloudinary failures produce safe fallbacks and visible error states.
- AI-generated drafts require vendor review before publication.

### Frontend
- Catalog loads a page of products, not the entire collection.
- Grid, list, mobile filters, sorting, empty state, and loading skeletons work.
- Product detail displays multiple images with responsive URLs, alt text, and fallback behavior.
- Vendor form supports multiple images, reordering/primary selection, alt text, and draft review.
- Recommendation shelves show a reason and gracefully fall back to trending/featured products.
- Visual search shows a clear upload state, result state, and no-result state.

### AI and data
- Gemini calls are server-only and use bounded prompts/candidate sets.
- Recommendation results exclude out-of-stock, archived, and unauthorized products.
- Event collection contains no sensitive fields.
- Atlas text/vector indexes are present and used by the intended queries.
- Embeddings are rebuilt or invalidated after media changes.

## 13. Implementation order

1. Add Atlas repository and migration path; verify data counts in Compass.
2. Extend product/media types and create the canonical `media`/`attributes` schema.
3. Add Cloudinary upload-signature and media-validation flow.
4. Replace full-list catalog loading with paginated server-side product APIs.
5. Build the shared product card and upgrade catalog/detail/vendor UIs.
6. Add server-only Gemini service and AI-assisted product draft endpoint.
7. Add event collection, recommendation candidates, reranking, and UI shelves.
8. Add Atlas text/vector indexes and Phase 2 visual-search endpoint/UI.
9. Add feature flags, audit events, fallback behavior, and operational health checks.
10. Run lint, build, API tests, migration checks, and browser acceptance checks.

## 14. Explicitly out of scope for Phase 1

- Full SKU/variant-level inventory and variant-specific pricing.
- Real payment processing changes.
- Real-time inventory synchronization across multiple warehouses.
- On-device AI.
- Automatic publication of AI-generated product content.
- Replacing MongoDB Compass with a custom database administration UI.
