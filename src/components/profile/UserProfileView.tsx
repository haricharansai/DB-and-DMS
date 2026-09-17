import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  MapPin,
  Package,
  Calendar,
  Key,
  Store,
  CheckCircle2,
  Edit3,
  Plus,
  ArrowRight,
  Truck,
  Sparkles,
  Save,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI } from '../../services/api';
import { Order, Address } from '../../types';

interface UserProfileViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ onNavigate }) => {
  const { user, logout, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [avatar, setAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '+91 98765 43210');
      setAvatar(user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const res = await ordersAPI.getAll();
      if (res.data && res.data.orders) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
          <UserIcon className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 font-heading">Sign In Required</h2>
        <p className="text-xs text-slate-500">
          Please sign in to view your individual account profile, saved addresses, and order history.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer"
        >
          Sign In to Account
        </button>
      </div>
    );
  }

  const defaultAddresses: Address[] = user.savedAddresses && user.savedAddresses.length > 0 ? user.savedAddresses : [
    {
      id: 'addr_1',
      fullName: user.name,
      phone: phone,
      street: 'Flat 402, Skyline Residency, 100 Feet Rd, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560038',
      isDefault: true
    },
    {
      id: 'addr_2',
      fullName: `${user.name} (Work)`,
      phone: phone,
      street: 'Tech Park 4, Outer Ring Road, Bellandur',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560103',
      isDefault: false
    }
  ];

  const roleBadges = {
    buyer: { label: 'Customer Account', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: UserIcon },
    vendor: { label: 'Merchant Partner', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Store },
    admin: { label: 'Platform Administrator', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: ShieldCheck },
  };

  const RoleIcon = roleBadges[user.role].icon;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* User Banner Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative">
              <img
                src={avatar}
                alt={user.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-indigo-600 shadow-md"
              />
              <span className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1 rounded-lg shadow-sm">
                <RoleIcon className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 font-heading">{user.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1 ${roleBadges[user.role].color}`}>
                  <RoleIcon className="w-3 h-3" />
                  <span>{roleBadges[user.role].label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
              </p>
              <p className="text-[11px] text-slate-400 flex items-center justify-center sm:justify-start gap-3 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Member since 2024
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {phone}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user.role === 'vendor' && (
              <button
                onClick={() => onNavigate('vendor-dashboard')}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>Open Vendor Portal</span>
              </button>
            )}

            {user.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Launch Admin Console</span>
              </button>
            )}

            <button
              onClick={logout}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-6 mt-6">
          {[
            { id: 'profile', label: 'Personal Information', icon: UserIcon },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
            { id: 'orders', label: 'My Orders & Tracking', icon: Package },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Personal Information */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-heading">Account Profile Details</h3>
                <p className="text-xs text-slate-500">Manage your personal identification and contact details</p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    disabled={!isEditing}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none text-slate-900 font-medium ${
                      isEditing ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    disabled={!isEditing}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none text-slate-900 font-medium ${
                      isEditing ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Email Address (Unique ID)</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-slate-100 text-slate-500 px-3 py-2.5 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              {isEditing && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Avatar Image URL</label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full bg-white border border-indigo-500 px-3 py-2.5 rounded-xl text-slate-900 font-medium outline-none"
                  />
                </div>
              )}

              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              )}
            </div>
          </div>

          {/* Security Overview */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 font-heading">Security & Credentials</h3>
              <p className="text-xs text-slate-500">Authentication token details</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session Protocol</span>
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>JWT Bearer Token Active</span>
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password Encryption</span>
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>bcrypt.js (Salt factor 10)</span>
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Account Role</span>
                <p className="font-bold text-indigo-700 uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Saved Shipping Addresses */}
      {activeTab === 'addresses' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-heading">Saved Delivery Addresses</h3>
              <p className="text-xs text-slate-500">Manage shipping destinations for direct vendor orders</p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition">
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Address</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {defaultAddresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-5 rounded-2xl border text-xs space-y-3 relative ${
                  addr.isDefault ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                {addr.isDefault && (
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full absolute top-4 right-4">
                    Default Address
                  </span>
                )}
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{addr.fullName}</p>
                  <p className="text-slate-600 font-medium">{addr.street}</p>
                  <p className="text-slate-600">{addr.city}, {addr.state} - {addr.zipCode}</p>
                  <p className="text-slate-400 font-mono pt-1">Phone: {addr.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Order History */}
      {activeTab === 'orders' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-heading">Order History & Tracking</h3>
            <p className="text-xs text-slate-500">Track current shipments and view previous multi-vendor purchases</p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No Orders Found</p>
              <button
                onClick={() => onNavigate('catalog')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-4 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900">Order #{ord.id}</p>
                      <p className="text-[11px] text-slate-400">{new Date(ord.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold uppercase text-[10px]">
                        Status: {ord.status}
                      </span>
                      <button
                        onClick={() => onNavigate('order-tracking', ord.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Order</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <img src={item.thumbnail} alt={item.title} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-500">Qty: {item.quantity} • Sold by {item.vendorName}</p>
                        </div>
                        <p className="font-extrabold text-slate-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex items-center justify-between font-bold text-slate-900">
                    <span>Total Amount Paid:</span>
                    <span className="text-sm text-indigo-600">₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
