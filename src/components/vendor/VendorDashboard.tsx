import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  X,
  Star,
  Store
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { productsAPI, ordersAPI, adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Product, Order } from '../../types';

interface VendorDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({ onNavigate }) => {
  const { user, openAuthModal } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  if (user?.role !== 'vendor' && user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <Store className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 font-heading">Merchant Access Required</h2>
        <p className="text-xs text-slate-500">
          The Vendor Portal is reserved for verified sellers. You are currently logged in as a Customer.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => openAuthModal('register')}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer"
          >
            Register as Merchant Partner
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
          >
            Return to Shopping
          </button>
        </div>
      </div>
    );
  }

  // Add/Edit Product Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('electronics');
  const [price, setPrice] = useState<number>(9999);
  const [originalPrice, setOriginalPrice] = useState<number>(12999);
  const [stock, setStock] = useState<number>(25);
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80');
  const [description, setDescription] = useState('');

  const vendorId = user?.vendorProfile?.id || 'ven_audio';

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [prodRes, ordRes] = await Promise.all([
        productsAPI.getAll(),
        ordersAPI.getAll(),
      ]);

      if (prodRes.data.products) {
        // Filter by this vendor or show all if admin/test
        const vendorProds = prodRes.data.products.filter(
          (p: Product) => p.vendorId === vendorId || user?.role === 'admin'
        );
        setProducts(vendorProds);
      }

      if (ordRes.data.orders) {
        setOrders(ordRes.data.orders);
      }
    } catch (err) {
      console.error('Failed to load vendor data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const totalRevenue = products.reduce((acc, p) => acc + p.price * 3, 1428000);

  const salesData = [
    { month: 'Jan', revenue: 240000, orders: 42 },
    { month: 'Feb', revenue: 380000, orders: 65 },
    { month: 'Mar', revenue: 520000, orders: 88 },
    { month: 'Apr', revenue: 490000, orders: 74 },
    { month: 'May', revenue: 780000, orders: 120 },
    { month: 'Jun', revenue: 950000, orders: 145 },
    { month: 'Jul', revenue: 1428000, orders: 198 },
  ];

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setBrand(user?.vendorProfile?.businessName || 'SonicPulse Audio');
    setCategory('electronics');
    setPrice(14999);
    setOriginalPrice(19999);
    setStock(40);
    setThumbnail('https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80');
    setDescription('High-definition studio wireless audio with low latency.');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setTitle(p.title);
    setBrand(p.brand);
    setCategory(p.category);
    setPrice(p.price);
    setOriginalPrice(p.originalPrice);
    setStock(p.stock);
    setThumbnail(p.thumbnail);
    setDescription(p.description);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // Update
        await productsAPI.update(editingProduct.id, {
          title,
          brand,
          category,
          price: Number(price),
          originalPrice: Number(originalPrice),
          stock: Number(stock),
          thumbnail,
          description,
        });
      } else {
        // Create
        await productsAPI.create({
          title,
          brand,
          category,
          price: Number(price),
          originalPrice: Number(originalPrice),
          stock: Number(stock),
          thumbnail,
          images: [thumbnail],
          description,
          tags: ['new', 'marketplace', category],
          specs: {
            warranty: '1 Year Manufacturer',
            origin: 'Made in India',
            dispatch: 'Same-day'
          }
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save product', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing from the marketplace?')) return;
    try {
      await productsAPI.delete(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await ordersAPI.updateStatus(orderId, {
        status: newStatus,
        vendorId,
        trackingNumber: 'FDX-' + Math.floor(10000000 + Math.random() * 90000000)
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-white">
                {user?.vendorProfile?.businessName || 'Merchant Partner Studio'}
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> KYC Verified Seller
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-vendor inventory orchestration, fulfillment dispatch, and direct settlement console
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product Listing</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gross Marketplace Volume', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, change: '+24.5%', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active Catalog Products', value: products.length, icon: Package, change: '100% In Stock', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending Consignments', value: orders.length, icon: Truck, change: 'SLA < 24 hrs', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Merchant Rating', value: '4.85 ★', icon: Star, change: 'Top 5% Seller', color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-heading">{stat.value}</div>
              <div className="text-[11px] font-bold text-slate-400">{stat.change}</div>
            </div>
          );
        })}
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 font-heading">Direct Revenue Growth Trends</h3>
            <p className="text-xs text-slate-500">Monthly gross sales volume processed via MarketNexus</p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            2026 Fiscal Year
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="vendorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip
                formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Gross Revenue']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#vendorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Products Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 font-heading">Merchant Product Inventory</h3>
            <p className="text-xs text-slate-500">Manage real-time prices, stock quantities, and catalog listings</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Listing</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px] text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock Units</th>
                <th className="p-3">Rating</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={p.thumbnail} alt={p.title} className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-200 p-1" />
                      <div>
                        <p className="font-bold text-slate-900 max-w-xs truncate">{p.title}</p>
                        <p className="text-[10px] text-slate-400">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 capitalize text-slate-600">{p.category}</td>
                  <td className="p-3 font-bold text-slate-900">₹{p.price.toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      p.stock > 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {p.stock} units
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-amber-500">★ {p.rating}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition"
                        title="Edit product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders Dispatch Workflow */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-6">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 font-heading">Incoming Consignment Orders</h3>
          <p className="text-xs text-slate-500">Fulfill orders, generate carrier airway bills, and update dispatch statuses</p>
        </div>

        <div className="space-y-4">
          {orders.map((ord) => (
            <div key={ord.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">Order #{ord.id}</span>
                    <span className="text-[10px] text-slate-400">• {new Date(ord.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Customer: <strong>{ord.shippingAddress.fullName}</strong> ({ord.shippingAddress.city}, {ord.shippingAddress.state})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Status:</span>
                  <select
                    value={ord.subOrders?.[0]?.status || ord.status}
                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                    className="bg-white border border-slate-300 text-xs font-bold rounded-xl px-2.5 py-1 text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="placed">Placed</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing / Packing</option>
                    <option value="shipped">Shipped via Carrier</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">{ord.items.length} items in package</span>
                <span className="font-extrabold text-slate-900">Order Value: ₹{ord.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                {editingProduct ? 'Edit Product Listing' : 'Add New Marketplace Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Product Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Sony WH-1000XM5 Noise Canceling Headphones"
                  className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Brand Name</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="electronics">Electronics & Audio</option>
                    <option value="computers">Laptops & Compute</option>
                    <option value="wearables">Smartwatches & Wearables</option>
                    <option value="cameras">Cameras & Optics</option>
                    <option value="gaming">Gaming & Consoles</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Price (₹)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">MRP / List (₹)</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={e => setOriginalPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Stock Units</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={e => setStock(Number(e.target.value))}
                    className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Image URL</label>
                <input
                  type="url"
                  value={thumbnail}
                  onChange={e => setThumbnail(e.target.value)}
                  className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Overview / Features</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl"
                >
                  {editingProduct ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
