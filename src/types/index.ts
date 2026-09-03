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

export interface Product {
  id: string;
  _id?: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  category: string;
  brand: string;
  vendorId: string;
  vendorName: string;
  rating: number;
  reviewsCount: number;
  stock: number;
  images: string[];
  thumbnail: string;
  colors?: string[];
  isFeatured?: boolean;
  isTrending?: boolean;
  isFlashDeal?: boolean;
  dealEndsInHours?: number;
  specs: ProductSpecification;
  tags: string[];
  createdAt: string;
}

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
