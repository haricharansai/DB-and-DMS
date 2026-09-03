import React, { useState, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal,
  Grid,
  List,
  Star,
  ShieldCheck,
  Heart,
  ShoppingBag,
  GitCompare,
  X,
  ChevronDown,
  RotateCcw,
  Check,
  Search,
  Filter
} from 'lucide-react';
import { productsAPI, categoriesAPI, vendorsAPI } from '../../services/api';
import { Product, Category, Vendor } from '../../types';
import { useCart } from '../../context/CartContext';
import { useComparison } from '../../context/ComparisonContext';

interface CatalogViewProps {
  initialFilter?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ initialFilter, onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number>(350000);
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { addToCompare, isInCompare } = useComparison();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [prodRes, catRes, venRes] = await Promise.all([
          productsAPI.getAll(),
          categoriesAPI.getAll(),
          vendorsAPI.getAll(),
        ]);
        if (prodRes.data.products) setProducts(prodRes.data.products);
        if (catRes.data.categories) setCategories(catRes.data.categories);
        if (venRes.data.vendors) setVendors(venRes.data.vendors);
      } catch (err) {
        console.error('Failed to load catalog data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle initialFilter passed from URL / navigation
  useEffect(() => {
    if (!initialFilter) return;

    if (initialFilter === 'deals') {
      // deals filter
    } else if (categories.some(c => c.slug === initialFilter || c.id === initialFilter)) {
      setSelectedCategory(initialFilter);
    } else if (vendors.some(v => v.id === initialFilter)) {
      setSelectedVendors([initialFilter]);
    } else {
      // Treat as search query
      setSearchFilter(initialFilter);
    }
  }, [initialFilter, categories, vendors]);

  // Unique brands
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => p.brand && set.add(p.brand));
    return Array.from(set);
  }, [products]);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        const catObj = categories.find(c => c.slug === selectedCategory);
        if (!catObj || p.category !== catObj.slug) return false;
      }

      // Brands
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) {
        return false;
      }

      // Vendors
      if (selectedVendors.length > 0 && !selectedVendors.includes(p.vendorId)) {
        return false;
      }

      // Price
      if (p.price > priceRange) {
        return false;
      }

      // Rating
      if (minRating > 0 && p.rating < minRating) {
        return false;
      }

      // In Stock
      if (onlyInStock && p.stock <= 0) {
        return false;
      }

      // Search
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(query);
        const matchDesc = p.description.toLowerCase().includes(query);
        const matchBrand = p.brand.toLowerCase().includes(query);
        const matchVendor = p.vendorName.toLowerCase().includes(query);
        const matchTag = p.tags && p.tags.some(t => t.toLowerCase().includes(query));
        if (!matchTitle && !matchDesc && !matchBrand && !matchVendor && !matchTag) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'discount') return (b.discountPercentage || 0) - (a.discountPercentage || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [products, selectedCategory, selectedBrands, selectedVendors, priceRange, minRating, onlyInStock, searchFilter, sortBy, categories]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleVendor = (vendorId: string) => {
    setSelectedVendors(prev =>
      prev.includes(vendorId) ? prev.filter(v => v !== vendorId) : [...prev, vendorId]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedBrands([]);
    setSelectedVendors([]);
    setPriceRange(350000);
    setMinRating(0);
    setOnlyInStock(false);
    setSearchFilter('');
    setSortBy('newest');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedBrands.length > 0 ||
    selectedVendors.length > 0 ||
    priceRange < 350000 ||
    minRating > 0 ||
    onlyInStock ||
    searchFilter.trim() !== '';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading">
            {selectedCategory !== 'all'
              ? categories.find(c => c.slug === selectedCategory)?.name || 'Category Catalog'
              : 'Marketplace Product Catalog'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Showing <span className="font-bold text-slate-800">{filteredProducts.length}</span> of {products.length} products with multi-vendor dispatch
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold transition"
          >
            <Filter className="w-4 h-4" />
            <span>Filters ({selectedBrands.length + (selectedCategory !== 'all' ? 1 : 0)})</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>

          {/* View Mode Toggle (Grid/List) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 bg-indigo-50/70 border border-indigo-100 p-3 rounded-2xl">
          <span className="text-xs font-bold text-indigo-900 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" /> Active Filters:
          </span>

          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-white text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200">
              Category: {selectedCategory}
              <button onClick={() => setSelectedCategory('all')} className="hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedBrands.map(b => (
            <span key={b} className="inline-flex items-center gap-1 bg-white text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200">
              Brand: {b}
              <button onClick={() => toggleBrand(b)} className="hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {priceRange < 350000 && (
            <span className="inline-flex items-center gap-1 bg-white text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200">
              Max: ₹{priceRange.toLocaleString('en-IN')}
              <button onClick={() => setPriceRange(350000)} className="hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {minRating > 0 && (
            <span className="inline-flex items-center gap-1 bg-white text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200">
              Rating: {minRating}★+
              <button onClick={() => setMinRating(0)} className="hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {searchFilter && (
            <span className="inline-flex items-center gap-1 bg-white text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200">
              Keyword: "{searchFilter}"
              <button onClick={() => setSearchFilter('')} className="hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="ml-auto text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        </div>
      )}

      {/* Main Grid with Sidebar Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden md:block md:col-span-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-6 sticky top-28">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span>Filters</span>
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] font-bold text-rose-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search within catalog */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Filter Keyword</label>
            <div className="relative">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search specs, model..."
                className="w-full bg-slate-50 text-slate-800 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Category</label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium transition flex items-center justify-between ${
                    selectedCategory === c.slug
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="text-[10px] opacity-75">{c.itemCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Slider */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Price Range</span>
              <span className="text-indigo-600 font-extrabold">₹{priceRange.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="5000"
              max="350000"
              step="5000"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>₹5,000</span>
              <span>₹3,50,000</span>
            </div>
          </div>

          {/* Brand Checkboxes */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700">Brands</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {availableBrands.map((b) => (
                <label
                  key={b}
                  className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b)}
                    onChange={() => toggleBrand(b)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 w-3.5 h-3.5"
                  />
                  <span>{b}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Vendor Filter */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700">Direct Merchants</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {vendors.filter(v => v.status === 'approved').map((v) => (
                <label
                  key={v.id}
                  className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedVendors.includes(v.id)}
                    onChange={() => toggleVendor(v.id)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 w-3.5 h-3.5"
                  />
                  <span className="truncate">{v.businessName}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Minimum Rating */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700">Minimum Rating</label>
            <div className="grid grid-cols-4 gap-1">
              {[4, 4.5, 4.8].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                  className={`py-1 rounded-lg text-xs font-bold border transition ${
                    minRating === rating
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {rating}★+
                </button>
              ))}
            </div>
          </div>

          {/* In-Stock Toggle */}
          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer">
              <span>In-Stock Only</span>
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </aside>

        {/* Product Grid / List Area */}
        <div className="md:col-span-9 space-y-6">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No matching products found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Try adjusting your price slider, clearing brand filters, or searching with broader terms.
                </p>
              </div>
              <button
                onClick={clearAllFilters}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div className="relative">
                    {prod.discountPercentage > 0 && (
                      <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                        {prod.discountPercentage}% OFF
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
                      className="h-48 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer p-2"
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
                        <span className="text-slate-500 truncate">Sold by <strong className="text-slate-700">{prod.vendorName}</strong></span>
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
                          <span>{isInCompare(prod.id) ? 'Comparing' : 'Compare'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row gap-5 items-center group"
                >
                  <div
                    onClick={() => onNavigate('product-detail', prod.id)}
                    className="w-full sm:w-48 h-40 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
                  >
                    <img
                      src={prod.thumbnail}
                      alt={prod.title}
                      className="max-h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-indigo-600 font-bold">{prod.brand}</span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-amber-500 font-semibold">
                        <Star className="w-3 h-3 fill-amber-500" /> {prod.rating} ({prod.reviewsCount} reviews)
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-600 font-medium">In Stock ({prod.stock} units)</span>
                    </div>

                    <h3
                      onClick={() => onNavigate('product-detail', prod.id)}
                      className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 cursor-pointer"
                    >
                      {prod.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2">{prod.description}</p>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Vendor: <strong className="text-slate-800">{prod.vendorName}</strong> (Same-day Dispatch)</span>
                    </div>
                  </div>

                  <div className="sm:text-right space-y-2 shrink-0 w-full sm:w-44 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div>
                      <div className="text-xl font-extrabold text-slate-900">₹{prod.price.toLocaleString('en-IN')}</div>
                      {prod.originalPrice > prod.price && (
                        <div className="text-xs text-slate-400 line-through">₹{prod.originalPrice.toLocaleString('en-IN')}</div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <button
                        onClick={() => addToCart(prod)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                      <button
                        onClick={() => addToCompare(prod)}
                        className={`w-full text-xs font-semibold py-1.5 rounded-xl border flex items-center justify-center gap-1 transition ${
                          isInCompare(prod.id)
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        <span>{isInCompare(prod.id) ? 'Comparing' : 'Compare'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
