import React, { useState, useEffect } from 'react';
import {
  Zap,
  ArrowRight,
  Star,
  ShieldCheck,
  Truck,
  TrendingUp,
  Flame,
  GitCompare,
  ShoppingBag,
  Sparkles,
  Heart,
  ChevronRight,
  Headphones,
  Laptop,
  Smartphone,
  Camera,
  Gamepad2,
  Armchair
} from 'lucide-react';
import { productsAPI, categoriesAPI, vendorsAPI } from '../../services/api';
import { Product, Category, Vendor } from '../../types';
import { useCart } from '../../context/CartContext';
import { useComparison } from '../../context/ComparisonContext';

interface HomeViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Flash deal countdown timer simulation
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });

  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { addToCompare, isInCompare } = useComparison();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(false);
        const [prodRes, catRes, venRes] = await Promise.all([
          productsAPI.getAll(),
          categoriesAPI.getAll(),
          vendorsAPI.getAll(),
        ]);
        if (prodRes.data.products) setProducts(prodRes.data.products);
        if (catRes.data.categories) setCategories(catRes.data.categories);
        if (venRes.data.vendors) setVendors(venRes.data.vendors);
      } catch (err) {
        console.error('Failed to load home data', err);
      }
    };
    fetchData();

    // Timer interval
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Headphones': return <Headphones className="w-6 h-6 text-indigo-600" />;
      case 'Laptop': return <Laptop className="w-6 h-6 text-indigo-600" />;
      case 'Smartphone': return <Smartphone className="w-6 h-6 text-indigo-600" />;
      case 'Camera': return <Camera className="w-6 h-6 text-indigo-600" />;
      case 'Gamepad2': return <Gamepad2 className="w-6 h-6 text-indigo-600" />;
      case 'Armchair': return <Armchair className="w-6 h-6 text-indigo-600" />;
      default: return <Sparkles className="w-6 h-6 text-indigo-600" />;
    }
  };

  const flashDealProducts = products.filter(p => p.isFlashDeal || p.discountPercentage > 10).slice(0, 4);
  const trendingProducts = products.filter(p => p.isTrending || p.rating >= 4.8).slice(0, 8);

  return (
    <div className="space-y-12 pb-12">
      {/* 1. SUMMER TECH FEST HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-indigo-950 to-slate-900 text-white shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Multi-Vendor Summer Tech Mega Fest 2025</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15] font-heading">
              Next-Gen Tech from <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-amber-300 to-indigo-200">
                Verified Direct Vendors
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Explore flagship laptops, studio noise-canceling headphones, and pro camera rigs with real-time multi-vendor cart dispatch and MongoDB-backed specs comparison.
            </p>

            {/* Countdown Strip */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl">
                <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                <span className="text-xs text-slate-300 font-medium">Deals Expire In:</span>
                <div className="flex items-center gap-1 font-mono text-sm font-bold text-amber-400">
                  <span className="bg-slate-800 px-2 py-0.5 rounded-md">{String(timeLeft.hours).padStart(2, '0')}h</span>
                  <span>:</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded-md">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                  <span>:</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded-md">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('catalog')}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
              >
                <span>Shop Festival Deals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Featured Hero Product Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md">
                14% OFF
              </div>
              <div className="h-56 overflow-hidden rounded-2xl bg-white/5 flex items-center justify-center p-4">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
                  alt="Sony WH-1000XM5"
                  className="max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-indigo-300">
                  <span className="font-semibold">Featured Flagship</span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 4.9 (184 reviews)
                  </span>
                </div>
                <h3 className="text-base font-bold text-white leading-snug">
                  Sony WH-1000XM5 Wireless ANC Headphones
                </h3>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-xl font-extrabold text-amber-300">₹29,990</span>
                    <span className="text-xs text-slate-400 line-through ml-2">₹34,990</span>
                  </div>
                  <button
                    onClick={() => onNavigate('product-detail', 'prod_wh1000xm5')}
                    className="bg-white text-slate-900 hover:bg-indigo-50 font-bold px-4 py-2 rounded-xl text-xs transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR CATEGORIES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">Popular Categories</h2>
            <p className="text-xs text-slate-500">Discover handpicked gear from verified merchants across categories</p>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All Categories</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigate('catalog', cat.slug)}
              className="bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 text-center transition group shadow-2xs flex flex-col items-center justify-center space-y-3 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition">
                {getCategoryIcon(cat.iconName)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">
                  {cat.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{cat.itemCount}+ Items</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. FLASH DEALS WITH LIVE COUNTDOWN */}
      <section className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-200/80 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 font-heading">Flash Deals</h2>
                <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Live Now
                </span>
              </div>
              <p className="text-xs text-slate-600">Limited quantities directly from certified manufacturers</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
            <span className="text-slate-500 font-medium">Ends in:</span>
            <span className="font-mono font-bold text-rose-600">
              {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {flashDealProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div className="relative">
                <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                  {prod.discountPercentage}% OFF
                </span>
                <button
                  onClick={() => toggleWishlist(prod)}
                  className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition ${
                    isInWishlist(prod.id)
                      ? 'bg-rose-50 text-rose-500'
                      : 'bg-white/80 text-slate-400 hover:text-rose-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist(prod.id) ? 'fill-rose-500' : ''}`} />
                </button>

                <div
                  onClick={() => onNavigate('product-detail', prod.id)}
                  className="h-44 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer"
                >
                  <img
                    src={prod.thumbnail}
                    alt={prod.title}
                    className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>

              <div className="mt-3 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="text-indigo-600 font-semibold">{prod.brand}</span>
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3 fill-amber-500" /> {prod.rating}
                    </span>
                  </div>
                  <h4
                    onClick={() => onNavigate('product-detail', prod.id)}
                    className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-2 cursor-pointer"
                  >
                    {prod.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">Vendor: <span className="text-slate-700 font-medium">{prod.vendorName}</span></p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-slate-900">₹{prod.price.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-slate-400 line-through">₹{prod.originalPrice.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addToCart(prod)}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => addToCompare(prod)}
                      className={`text-xs font-semibold py-2 rounded-xl border flex items-center justify-center gap-1 transition ${
                        isInCompare(prod.id)
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>{isInCompare(prod.id) ? 'Compared' : 'Compare'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. TRENDING PRODUCTS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Trending Products</span>
            </h2>
            <p className="text-xs text-slate-500">Top rated tech gear curated from high-fulfillment sellers</p>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>Explore Catalog ({products.length} Products)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {trendingProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div className="relative">
                {prod.isFeatured && (
                  <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                    Staff Pick
                  </span>
                )}
                <button
                  onClick={() => toggleWishlist(prod)}
                  className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition ${
                    isInWishlist(prod.id)
                      ? 'bg-rose-50 text-rose-500'
                      : 'bg-white/80 text-slate-400 hover:text-rose-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist(prod.id) ? 'fill-rose-500' : ''}`} />
                </button>

                <div
                  onClick={() => onNavigate('product-detail', prod.id)}
                  className="h-44 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer"
                >
                  <img
                    src={prod.thumbnail}
                    alt={prod.title}
                    className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>

              <div className="mt-3 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="text-indigo-600 font-semibold">{prod.brand}</span>
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3 fill-amber-500" /> {prod.rating} ({prod.reviewsCount})
                    </span>
                  </div>
                  <h4
                    onClick={() => onNavigate('product-detail', prod.id)}
                    className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-2 cursor-pointer"
                  >
                    {prod.title}
                  </h4>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span className="text-slate-500 truncate">By {prod.vendorName}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-slate-900">₹{prod.price.toLocaleString('en-IN')}</span>
                    {prod.originalPrice > prod.price && (
                      <span className="text-xs text-slate-400 line-through">₹{prod.originalPrice.toLocaleString('en-IN')}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addToCart(prod)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={() => addToCompare(prod)}
                      className={`text-xs font-semibold py-2 rounded-xl border flex items-center justify-center gap-1 transition ${
                        isInCompare(prod.id)
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>{isInCompare(prod.id) ? 'In Compare' : 'Compare'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. TOP VERIFIED MERCHANTS SHOWCASE */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Certified Partner Network</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading">Top Verified Merchants</h2>
          </div>
          <button
            onClick={() => onNavigate('vendor-dashboard')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>Partner Hub</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {vendors.filter(v => v.status === 'approved').map((ven) => (
            <div
              key={ven.id}
              className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 space-y-3 hover:border-amber-400/50 transition group"
            >
              <div className="flex items-center gap-3">
                <img
                  src={ven.logo}
                  alt={ven.businessName}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-600"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                    {ven.businessName}
                  </h4>
                  <p className="text-[11px] text-slate-400">{ven.city}</p>
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span className="font-bold">{ven.rating}</span>
                    <span className="text-slate-500">({ven.reviewsCount})</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Badge:</span>
                  <span className="text-amber-400 font-semibold">{ven.badge || 'Verified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SLA:</span>
                  <span className="text-emerald-400 font-medium">{ven.dispatchTime}</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('catalog', ven.id)}
                className="w-full bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-1.5 rounded-xl transition"
              >
                Browse Store Products
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
