import axios, { AxiosInstance } from 'axios';
import {
  Product,
  Vendor,
  Category,
  Order,
  Review,
  User,
  AdminMetrics,
  ProductQueryParams,
  ProductListResponse,
  ProductCreateDTO,
  ProductUpdateDTO,
  MediaUploadSignatureRequest,
  MediaUploadSignatureResponse,
  CloudinaryUploadResult,
  AIDraftRequest,
  AIDraftResponse,
  AISearchRequest,
  AISearchResponse,
  VisualSearchRequest,
  VisualSearchResponse,
  RecommendationContext,
  RecommendationResponse,
  ProductEventPayload,
  ProductEvent,
} from '../types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('marketnexus_jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post<{ success: boolean; token: string; user: User }>('/auth/login', credentials),
  register: (data: { name: string; email: string; password: string; role?: string; phone?: string; businessName?: string; gstin?: string }) =>
    api.post<{ success: boolean; token: string; user: User }>('/auth/register', data),
  getMe: () => api.get<{ success: boolean; user: User }>('/auth/me'),
  switchRole: (targetRole: string) =>
    api.post<{ success: boolean; token: string; user: User; message: string }>('/auth/switch-role', { targetRole }),
};

export const productsAPI = {
  getAll: (params?: ProductQueryParams) =>
    api.get<ProductListResponse>('/products', { params }),
  getPaginated: (params?: ProductQueryParams) =>
    api.get<ProductListResponse>('/products', { params }),
  getById: (id: string) =>
    api.get<{ success: boolean; product: Product; vendor: Vendor; reviews: Review[] }>(`/products/${id}`),
  create: (data: ProductCreateDTO) =>
    api.post<{ success: boolean; product: Product }>('/products', data),
  update: (id: string, data: ProductUpdateDTO) =>
    api.put<{ success: boolean; product: Product }>(`/products/${id}`, data),
  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/products/${id}`),
};

export const categoriesAPI = {
  getAll: () => api.get<{ success: boolean; categories: Category[] }>('/categories'),
};

export const vendorsAPI = {
  getAll: () => api.get<{ success: boolean; vendors: Vendor[] }>('/vendors'),
  getById: (id: string) =>
    api.get<{ success: boolean; vendor: Vendor; products: Product[] }>(`/vendors/${id}`),
};

export const ordersAPI = {
  getAll: () => api.get<{ success: boolean; orders: Order[] }>('/orders'),
  getById: (id: string) => api.get<{ success: boolean; order: Order }>(`/orders/${id}`),
  create: (orderData: { items: any[]; shippingAddress: any; paymentMethod: string }) =>
    api.post<{ success: boolean; order: Order }>('/orders', orderData),
  updateStatus: (id: string, data: { status: string; vendorId?: string; trackingNumber?: string }) =>
    api.put<{ success: boolean; order: Order }>(`/orders/${id}/status`, data),
};

export const reviewsAPI = {
  getByProduct: (productId: string) =>
    api.get<{ success: boolean; reviews: Review[] }>('/reviews', { params: { productId } }),
  create: (data: { productId: string; rating: number; title: string; comment: string }) =>
    api.post<{ success: boolean; review: Review }>('/reviews', data),
};

export const mediaAPI = {
  getUploadSignature: (data: MediaUploadSignatureRequest) =>
    api.post<MediaUploadSignatureResponse>('/media/upload-signature', data),
  uploadToCloudinary: async (file: File, signature: MediaUploadSignatureResponse) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('signature', signature.signature);
    formData.append('public_id', signature.publicId);
    if (signature.folder) formData.append('folder', signature.folder);
    if (signature.tags?.length) formData.append('tags', signature.tags.join(','));

    const uploadUrl = signature.uploadUrl || `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;
    const response = await fetch(uploadUrl, { method: 'POST', body: formData });
    if (!response.ok) {
      throw new Error('Cloudinary upload failed');
    }
    return response.json() as Promise<CloudinaryUploadResult>;
  },
};

export const aiAPI = {
  createDraft: (data: AIDraftRequest) =>
    api.post<AIDraftResponse>('/ai/products/draft', data),
  search: (data: AISearchRequest) =>
    api.post<AISearchResponse>('/ai/search', data),
  visualSearch: (data: VisualSearchRequest) =>
    api.post<VisualSearchResponse>('/ai/visual-search', data),
};

export const recommendationsAPI = {
  getForContext: (data: RecommendationContext) =>
    api.get<RecommendationResponse>('/recommendations', { params: data }),
  getForProduct: (productId: string, limit = 6) =>
    api.get<RecommendationResponse>('/recommendations', { params: { context: 'product_detail', productId, limit } }),
};

export const eventsAPI = {
  track: (data: ProductEventPayload) =>
    api.post<{ success: boolean; event: ProductEvent }>('/events', {
      ...data,
      occurredAt: data.occurredAt || new Date().toISOString(),
    }),
};

export const adminAPI = {
  getMetrics: () => api.get<AdminMetrics>('/admin/metrics'),
  updateVendorStatus: (id: string, status: string) =>
    api.put<{ success: boolean; vendor: Vendor }>(`/admin/vendors/${id}/status`, { status }),
  approveVendor: (id: string) => api.post<{ success: boolean; vendor: Vendor }>(`/admin/vendors/${id}/approve`),
  rejectVendor: (id: string) => api.post<{ success: boolean; vendor: Vendor }>(`/admin/vendors/${id}/reject`),
};

export const compassAPI = {
  getCollections: () => api.get<any>('/mongodb/collections'),
  getDocuments: (collection: string, filter?: any, sort?: any) =>
    api.post<any>('/mongodb/query', { collection, filter, sort }),
  insertDocument: (collection: string, doc: any) =>
    api.post<any>(`/mongodb/collections/${collection}`, doc),
  updateDocument: (collection: string, id: string, doc: any) =>
    api.put<any>(`/mongodb/collections/${collection}/${id}`, doc),
  deleteDocument: (collection: string, id: string) =>
    api.delete<any>(`/mongodb/collections/${collection}/${id}`),
};

export const mongoAPI = compassAPI;
