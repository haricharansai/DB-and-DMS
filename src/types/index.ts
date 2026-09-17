export type UserRole = 'buyer' | 'vendor' | 'admin';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}

export interface Vendor {
  id: string;
  _id?: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  status: 'approved' | 'pending' | 'rejected' | 'suspended';
  gstin?: string;
  commissionRate?: number;
  badge?: string;
  logo: string;
  banner?: string;
  joinedDate: string;
  dispatchTime: string;
  city: string;
  kycDetails?: {
    gstNumber: string;
    panNumber: string;
    businessLicense: string;
    documentUrl: string;
    submittedAt: string;
  };
  metrics?: {
    totalRevenue: number;
    totalOrders: number;
    fulfillmentRate: number;
  };
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  vendorId?: string;
  vendorProfile?: Vendor;
  createdAt: string;
  savedAddresses?: Address[];
}

export interface ProductSpecification {
  display?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  battery?: string;
  camera?: string;
  weight?: string;
  anc?: string;
  codecs?: string;
  connectivity?: string;
  warranty?: string;
  material?: string;
  [key: string]: string | undefined;
}

export type ProductStatus = 'draft' | 'pending_review' | 'published' | 'archived';
export type ProductMediaRole = 'primary' | 'gallery' | 'swatch' | 'lifestyle';
export type ProductMediaFormat = 'jpg' | 'png' | 'webp' | 'avif';
export type ProductAttributeValue = string | number | boolean;
export type ProductAttributes = Record<string, ProductAttributeValue>;

export interface ProductMedia {
  id: string;
  _id?: string;
  publicId: string;
  url: string;
  secureUrl: string;
  format: ProductMediaFormat;
  width: number;
  height: number;
  bytes: number;
  version: number;
  role: ProductMediaRole;
  altText: string;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductMediaDraft {
  id?: string;
  publicId?: string;
  url: string;
  secureUrl?: string;
  format?: ProductMediaFormat;
  width?: number;
  height?: number;
  bytes?: number;
  version?: number;
  role: ProductMediaRole;
  altText: string;
  position: number;
  file?: File;
}

export interface ProductAI {
  descriptionSource?: 'vendor' | 'gemini';
  attributesSource?: 'vendor' | 'gemini';
  moderationStatus?: 'not_run' | 'approved' | 'needs_review' | 'rejected';
  attributeConfidence?: number;
  lastAiRunAt?: string;
}

export interface ProductVendorSummary {
  id: string;
  name: string;
  isVerified: boolean;
}

export interface Product {
  id: string;
  _id?: string;
  slug?: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  category: string;
  brand: string;
  vendorId: string;
  vendorName: string;
  vendor?: ProductVendorSummary;
  vendorVerified?: boolean;
  status?: ProductStatus;
  rating: number;
  reviewsCount: number;
  stock: number;
  media?: ProductMedia[];
  images: string[];
  thumbnail: string;
  colors?: string[];
  attributes?: ProductAttributes;
  ai?: ProductAI;
  isFeatured?: boolean;
  isTrending?: boolean;
  isFlashDeal?: boolean;
  dealEndsInHours?: number;
  dealEndsAt?: string;
  specs: ProductSpecification;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface ProductCreateDTO {
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  brand: string;
  stock: number;
  colors?: string[];
  media?: ProductMedia[];
  mediaPublicIds?: string[];
  images?: string[];
  thumbnail?: string;
  attributes?: ProductAttributes;
  specs?: ProductSpecification;
  tags?: string[];
  status?: ProductStatus;
  isFeatured?: boolean;
  isTrending?: boolean;
  isFlashDeal?: boolean;
}

export type ProductUpdateDTO = Partial<ProductCreateDTO>;

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta extends PaginationParams {
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ProductFacetOption {
  value: string;
  label: string;
  count: number;
  selected?: boolean;
}

export interface ProductPriceRange {
  min: number;
  max: number;
}

export interface ProductFacets {
  brands: ProductFacetOption[];
  categories: ProductFacetOption[];
  vendors: ProductFacetOption[];
  priceRange: ProductPriceRange;
  ratings?: ProductFacetOption[];
  availability?: ProductFacetOption[];
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'discount' | 'popularity';

export interface ProductQueryParams extends PaginationParams {
  category?: string;
  brand?: string;
  brands?: string[];
  vendorId?: string;
  vendors?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  status?: ProductStatus | 'all';
  featured?: boolean;
  trending?: boolean;
  flashDeal?: boolean;
  search?: string;
  sort?: ProductSort;
  aiSearch?: boolean;
}

export interface ProductListResponse {
  success: boolean;
  products: Product[];
  pagination: PaginationMeta;
  facets: ProductFacets;
}

export interface RecommendationContext {
  context: 'home' | 'catalog' | 'product_detail' | 'cart';
  productId?: string;
  limit?: number;
}

export interface RecommendationResponse {
  success: boolean;
  products: Product[];
  reasons: Record<string, string>;
  fallback: boolean;
}

export type ProductEventType = 'product_view' | 'search' | 'add_to_cart' | 'wishlist' | 'purchase';

export interface ProductEvent {
  id?: string;
  userId?: string;
  anonymousId?: string;
  sessionId: string;
  eventType: ProductEventType;
  productId?: string;
  query?: string;
  metadata?: Record<string, string | number | boolean>;
  occurredAt: string;
  consentVersion?: string;
}

export type ProductEventPayload = Omit<ProductEvent, 'occurredAt'> & { occurredAt?: string };

export interface MediaUploadSignatureRequest {
  filename: string;
  folder?: string;
  resourceType?: 'image' | 'raw' | 'video' | 'auto';
  publicId?: string;
  tags?: string[];
}

export interface MediaUploadSignatureResponse {
  success: boolean;
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  publicId: string;
  folder?: string;
  tags?: string[];
  resourceType: 'image' | 'raw' | 'video' | 'auto';
  uploadUrl?: string;
}

export interface CloudinaryUploadResult {
  asset_id?: string;
  public_id: string;
  version?: number;
  version_id?: string;
  format?: string;
  resource_type?: string;
  created_at?: string;
  tags?: string[];
  bytes?: number;
  type?: string;
  etag?: string;
  placeholder?: boolean;
  url?: string;
  secure_url: string;
  access_mode?: string;
  context?: Record<string, string>;
  metadata?: Record<string, string>;
  width?: number;
  height?: number;
  original_filename?: string;
}

export interface AIDraftRequest {
  rawTitle?: string;
  rawDescription?: string;
  rawSpecifications?: Record<string, string>;
  category: string;
  brand?: string;
  mediaPublicIds?: string[];
}

export interface AIDraftResponse {
  title: string;
  description: string;
  attributes: ProductAttributes;
  tags: string[];
  colors: string[];
  altTextByMediaId: Record<string, string>;
  confidence: number;
  warnings: string[];
}

export interface AISearchRequest {
  query: string;
  filters?: ProductQueryParams;
  limit?: number;
}

export interface AISearchResult {
  product: Product;
  score?: number;
  explanation?: string;
  reason?: string;
}

export interface AISearchResponse {
  success: boolean;
  products: Product[];
  results?: AISearchResult[];
  pagination?: PaginationMeta;
  facets?: ProductFacets;
  fallback?: boolean;
  message?: string;
}

export interface VisualSearchRequest {
  mediaPublicId?: string;
  imageUrl?: string;
  filters?: ProductQueryParams;
  limit?: number;
}

export interface VisualSearchResponse {
  success: boolean;
  products: Product[];
  results?: Array<AISearchResult & { similarity?: number }>;
  queryMedia?: ProductMedia;
  fallback?: boolean;
  message?: string;
}

export type AIResponse = AIDraftResponse | AISearchResponse | VisualSearchResponse;

export interface Review {
  id: string;
  _id?: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  vendorId: string;
  vendorName: string;
}

export interface VendorCartGroup {
  vendorId: string;
  vendorName: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
}

export type OrderStatus = 'placed' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface TrackingMilestone {
  status: OrderStatus;
  label: string;
  description: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  selectedColor?: string;
  thumbnail: string;
  vendorId: string;
  vendorName: string;
}

export interface VendorSubOrder {
  vendorId: string;
  vendorName: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  status: OrderStatus;
  trackingNumber: string;
  courier: string;
  estimatedDelivery: string;
  milestones: TrackingMilestone[];
}

export interface Order {
  id: string;
  _id?: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Address;
  items: OrderItem[];
  subOrders: VendorSubOrder[];
  subtotal: number;
  tax: number;
  shippingTotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: 'card' | 'upi' | 'netbanking' | 'cod';
  paymentStatus: 'paid' | 'pending' | 'failed';
  status: OrderStatus;
  createdAt: string;
  overallTrackingNumber: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  itemCount: number;
  image: string;
  description: string;
}

export interface AdminMetrics {
  totalRevenue: number;
  platformCommission: number;
  totalOrders: number;
  totalVendors: number;
  totalProducts: number;
}

export interface MongoCollectionDoc {
  [key: string]: any;
}
