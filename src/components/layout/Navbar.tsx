import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Heart,
  GitCompare,
  Search,
  User as UserIcon,
  Database,
  Truck,
  ShieldCheck,
  ChevronDown,
  Store,
  LayoutDashboard,
  LogOut,
  SlidersHorizontal,
  Flame,
  Sparkles,
  Zap,
  Tag,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useComparison } from '../../context/ComparisonContext';
import { productsAPI } from '../../services/api';
import { Product, UserRole } from '../../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenCompass: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenCompass }) => {
  const { user, logout, switchRole, openAuthModal, isAuthenticated } = useAuth();
  const { itemCount, wishlist, showToast } = useCart();
  const { compareItems } = useComparison();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await productsAPI.getAll({ search: searchQuery });
        if (res.data && res.data.products) {
          setSearchResults(res.data.products.slice(0, 5));
          setIsSearchOpen(true);
        }
      } catch (err) {
        console.error('Search error', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSelect = (productId: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    onNavigate('product-detail', productId);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      onNavigate('catalog', searchQuery.trim());
    }
  };

  const roleColors: Record<UserRole, { bg: string; text: string; border: string; label: string }> = {
    buyer: { bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-600', border: 'border-emerald-200', label: 'Buyer View' },
    vendor: { bg: 'bg-amber-50 text-amber-700', text: 'text-amber-600', border: 'border-amber-200', label: 'Seller Portal' },
    admin: { bg: 'bg-indigo-50 text-indigo-700', text: 'text-indigo-600', border: 'border-indigo-200', label: 'Admin Console' },
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-all">
      {/* Toast Alert Banner */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-slate-300">
            <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
              <Zap className="w-3.5 h-3.5" />
              Summer Tech Fest: Flat 15% OFF with code <code className="bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-semibold">NEXUSFEST</code>
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline-flex items-center gap-1">
              <Truck className="w-3 h-3 text-slate-400" /> Free Shipping on vendor orders above ₹1,000
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Persona Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 text-xs">
              <span className="text-slate-400 text-[11px] font-medium mr-1">Switch Role:</span>
              <button
                onClick={() => switchRole('buyer')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition ${
                  user?.role === 'buyer' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Buyer
              </button>
              <button
                onClick={() => switchRole('vendor')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition ${
                  user?.role === 'vendor' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Vendor
              </button>
              <button
                onClick={() => switchRole('admin')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition ${
                  user?.role === 'admin' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>

            {/* MongoDB Compass Viewer Button */}
            <button
              onClick={onOpenCompass}
              className="inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900 border border-emerald-800/80 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium transition cursor-pointer"
              title="Inspect Live MongoDB Collections and Execute Queries"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Database className="w-3 h-3 text-emerald-400" />
              <span>MongoDB Compass</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Brand & Search Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4 md:gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-indigo-900 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1 font-heading">
                  Market<span className="text-indigo-600">Nexus</span>
                </span>
                <span className="text-[10px] block font-semibold text-slate-600 tracking-wider uppercase">
                  Multi-Vendor Ecosystem
                </span>
              </div>
            </button>
          </div>

          {/* Search Bar with Autocomplete Dropdown */}
          <div ref={searchRef} className="relative flex-1 max-w-2xl hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
                placeholder="Search products, brands, noise cancellation, M3 Max, Sony, Samsung..."
                className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 pl-11 pr-24 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm transition outline-none"
              />
              <Search className="w-4 h-4 text-slate-600 absolute left-4 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
              >
                Search
              </button>
            </form>

            {/* Live Autocomplete Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                  <span>Matching Products</span>
                  <span className="font-mono text-[11px]">{searchResults.length} results</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {searchResults.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => handleSearchSelect(prod.id)}
                      className="w-full text-left p-3 hover:bg-indigo-50/60 flex items-center gap-3 transition group"
                    >
                      <img
                        src={prod.thumbnail}
                        alt={prod.title}
                        className="w-11 h-11 object-cover rounded-lg bg-slate-100 border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 truncate">
                          {prod.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-700">₹{prod.price.toLocaleString('en-IN')}</span>
                          <span>•</span>
                          <span className="text-slate-400">{prod.brand}</span>
                          <span>•</span>
                          <span className="text-indigo-500 font-medium">Sold by {prod.vendorName}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      onNavigate('catalog', searchQuery);
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View all matching results in Catalog →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Badges & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Compare Products Badge */}
            <button
              onClick={() => onNavigate('comparison')}
              className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition"
              title="Compare Specifications"
            >
              <GitCompare className="w-5 h-5" />
              {compareItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {compareItems.length}
                </span>
              )}
            </button>

            {/* Wishlist */}
            <button
              onClick={() => onNavigate('wishlist')}
              className="relative p-2 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition"
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Multi-Vendor Cart */}
            <button
              onClick={() => onNavigate('cart')}
              className="relative flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-sm font-semibold shadow-xs transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="bg-amber-400 text-slate-900 text-xs font-extrabold px-1.5 py-0.2 rounded-full ml-0.5">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Account / Role Badge */}
            <div ref={userMenuRef} className="relative">
              {isAuthenticated && user ? (
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition border border-slate-200"
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover border border-slate-300"
                  />
                  <div className="hidden lg:block text-left text-xs">
                    <p className="font-semibold text-slate-800 leading-tight truncate max-w-[100px]">{user.name.split(' ')[0]}</p>
                    <span className={`inline-block px-1 rounded font-bold text-[9px] uppercase tracking-wider ${roleColors[user.role].bg}`}>
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-xs font-bold transition border border-indigo-200"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* User Dropdown */}
              {isUserMenuOpen && user && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleColors[user.role].bg}`}>
                        Role: {user.role}
                      </span>
                    </div>
                  </div>

                  <div className="py-1 text-xs text-slate-700">
                    {user.role === 'vendor' && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('vendor-dashboard');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 font-medium"
                      >
                        <Store className="w-4 h-4 text-amber-500" />
                        <span>Vendor Portal & Products</span>
                      </button>
                    )}

                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('admin-dashboard');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 font-medium"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        <span>Admin Console & Approvals</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('orders');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 font-medium"
                    >
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span>My Orders & Live Tracking</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenCompass();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 font-medium font-mono text-[11px]"
                    >
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span>MongoDB Compass Studio</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1 text-xs">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl md:hidden"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Subnav Navigation Links */}
      <nav className="bg-slate-50 border-t border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-semibold overflow-x-auto py-2 scrollbar-none gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => onNavigate('catalog')}
              className={`flex items-center gap-1.5 whitespace-nowrap transition ${
                currentView === 'catalog' ? 'text-indigo-600 font-bold' : 'text-slate-700 hover:text-indigo-600'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
              <span>All Categories & Catalog</span>
            </button>

            <button
              onClick={() => onNavigate('catalog', 'electronics')}
              className="text-slate-600 hover:text-indigo-600 whitespace-nowrap"
            >
              Electronics & Audio
            </button>
            <button
              onClick={() => onNavigate('catalog', 'laptops')}
              className="text-slate-600 hover:text-indigo-600 whitespace-nowrap"
            >
              Laptops & Computing
            </button>
            <button
              onClick={() => onNavigate('catalog', 'smartphones')}
              className="text-slate-600 hover:text-indigo-600 whitespace-nowrap"
            >
              Smartphones
            </button>
            <button
              onClick={() => onNavigate('catalog', 'cameras')}
              className="text-slate-600 hover:text-indigo-600 whitespace-nowrap"
            >
              Cameras & Optics
            </button>
            <button
              onClick={() => onNavigate('catalog', 'workspace')}
              className="text-slate-600 hover:text-indigo-600 whitespace-nowrap"
            >
              Ergonomics
            </button>
          </div>

          <div className="flex items-center gap-4 border-l border-slate-200 pl-4">
            <button
              onClick={() => onNavigate('catalog', 'deals')}
              className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold whitespace-nowrap"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Flash Deals</span>
            </button>

            <button
              onClick={() => onNavigate('vendor-dashboard')}
              className="flex items-center gap-1 text-amber-700 hover:text-amber-800 font-bold whitespace-nowrap"
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>Vendor Hub</span>
            </button>

            <button
              onClick={() => onNavigate('admin-dashboard')}
              className="flex items-center gap-1 text-indigo-700 hover:text-indigo-800 font-bold whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Moderation</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};
