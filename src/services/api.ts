import axios, { AxiosInstance } from 'axios';
import { Product, Vendor, Category, Order, Review, User, AdminMetrics } from '../types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT Bearer token on every request if present
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

// Typed API functions
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
  getAll: (params?: Record<string, any>) =>
    api.get<{ success: boolean; count: number; products: Product[] }>('/products', { params }),
  getById: (id: string) =>
    api.get<{ success: boolean; product: Product; vendor: Vendor; reviews: Review[] }>(`/products/${id}`),
  create: (data: Partial<Product>) =>
    api.post<{ success: boolean; product: Product }>('/products', data),
  update: (id: string, data: Partial<Product>) =>
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
