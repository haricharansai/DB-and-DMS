import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SlidersHorizontal,
  Grid,
  List,
  Star,
  ShieldCheck,
  Search,
  Filter,
  X,
  RotateCcw,
  Sparkles,
  Upload,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
} from 'lucide-react';
import { productsAPI, categoriesAPI, vendorsAPI, aiAPI, mediaAPI, recommendationsAPI, eventsAPI } from '../../services/api';
import {
  Product,
  Category,
  Vendor,
  ProductFacets,
  ProductFacetOption,
  ProductListResponse,
  ProductQueryParams,
  ProductSort,
  ProductStatus,
  PaginationMeta,
  RecommendationResponse,
  VisualSearchResponse,
} from '../../types';
import { ProductCard } from './ProductCard';
import { useCart } from '../../context/CartContext';
import { useComparison } from '../../context/ComparisonContext';

interface CatalogViewProps {
  initialFilter?: string;
  onNavigate: (view: string, param?: string) => void;
}

interface ParsedHashFilters {
  hasQuery: boolean;
  category?: string;
  brands?: string[];
  vendors?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  featured?: boolean;
  trending?: boolean;
  flashDeal?: boolean;
  status?: ProductStatus | 'all';
  search?: string;
  sort?: ProductSort;
  aiSearch?: boolean;
  page?: number;
  limit?: number;
}

const DEFAULT_LIMIT = 12;
const DEFAULT_MAX_PRICE = 350000;

const parseHashFilters = (): ParsedHashFilters => {
  const hash = window.location.hash.replace(/^#/, '');
  const queryIndex = hash.indexOf('?');
  if (queryIndex < 0) return { hasQuery: false };

  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  const numberValue = (name: string) => {
    const value = Number(params.get(name));
    return Number.isFinite(value) ? value : undefined;
  };
  const listValue = (name: string) => params.get(name)?.split(',').map((value) => value.trim()).filter(Boolean);
  const boolValue = (name: string) => params.get(name) === '1' || params.get(name) === 'true';

  return {
    hasQuery: true,
    category: params.get('category') || undefined,
    brands: listValue('brands'),
    vendors: listValue('vendors'),
    minPrice: numberValue('minPrice'),
    maxPrice: numberValue('maxPrice'),
    minRating: numberValue('minRating'),
    inStock: boolValue('inStock'),
    featured: boolValue('featured'),
    trending: boolValue('trending'),
    flashDeal: boolValue('flashDeal'),
    status: (params.get('status') as ProductStatus | 'all') || undefined,
    search: params.get('q') || undefined,
    sort: (params.get('sort') as ProductSort) || undefined,
    aiSearch: boolValue('ai'),
    page: numberValue('page'),
    limit: numberValue('limit'),
  };
};

const emptyFacets = (): ProductFacets => ({
  brands: [],
  categories: [],
  vendors: [],
  priceRange: { min: 0, max: DEFAULT_MAX_PRICE },
});

const makePagination = (page: number, limit: number, total: number): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
  hasPreviousPage: page > 1,
  hasNextPage: page < Math.max(1, Math.ceil(total / limit)),
});

const ProductSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
    <div className="h-48 rounded-xl bg-slate-100" />
    <div className="h-3 w-1/3 rounded bg-slate-100" />
    <div className="h-4 w-11/12 rounded bg-slate-100" />
    <div className="h-4 w-3/4 rounded bg-slate-100" />
    <div className="h-8 w-full rounded-xl bg-slate-100" />
  </div>
);

export const CatalogView: React.FC<CatalogViewProps> = ({ initialFilter, onNavigate }) => {
  const initialHash = useMemo(() => parseHashFilters(), []);
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { addToCompare, isInCompare } = useComparison();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [facets, setFacets] = useState<ProductFacets>(emptyFacets);
  const [pagination, setPagination] = useState<PaginationMeta>(() => makePagination(initialHash.page || 1, initialHash.limit || DEFAULT_LIMIT, 0));
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState<string>(() => initialHash.category || 'all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => initialHash.brands || []);
  const [selectedVendors, setSelectedVendors] = useState<string[]>(() => initialHash.vendors || []);
  const [minPrice, setMinPrice] = useState<number>(() => initialHash.minPrice || 0);
  const [priceRange, setPriceRange] = useState<number>(() => initialHash.maxPrice || DEFAULT_MAX_PRICE);
  const [minRating, setMinRating] = useState<number>(() => initialHash.minRating || 0);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(() => initialHash.inStock || false);
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(() => initialHash.featured || false);
  const [trendingOnly, setTrendingOnly] = useState<boolean>(() => initialHash.trending || false);
  const [flashDealsOnly, setFlashDealsOnly] = useState<boolean>(() => initialHash.flashDeal || false);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>(() => initialHash.status || 'published');
  const [searchFilter, setSearchFilter] = useState<string>(() => initialHash.search || '');
  const [sortBy, setSortBy] = useState<ProductSort>(() => initialHash.sort || 'newest');
  const [aiSearchMode, setAiSearchMode] = useState<boolean>(() => initialHash.aiSearch || false);
  const [aiFallbackMessage, setAiFallbackMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [recommendationReasons, setRecommendationReasons] = useState<Record<string, string>>({});
  const [visualFile, setVisualFile] = useState<File | null>(null);
  const [visualResults, setVisualResults] = useState<Product[]>([]);
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [appliedInitialFilter, setAppliedInitialFilter] = useState(!initialFilter || initialHash.hasQuery);

  const catalogParams = useMemo<ProductQueryParams>(() => ({
    page: pagination.page,
    limit: pagination.limit,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    brands: selectedBrands.length ? selectedBrands : undefined,
    vendors: selectedVendors.length ? selectedVendors : undefined,
    minPrice: minPrice > 0 ? minPrice : undefined,
    maxPrice: priceRange < DEFAULT_MAX_PRICE ? priceRange : undefined,
    minRating: minRating > 0 ? minRating : undefined,
    inStock: onlyInStock || undefined,
    featured: featuredOnly || undefined,
    trending: trendingOnly || undefined,
    flashDeal: flashDealsOnly || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchFilter.trim() || undefined,
    sort: sortBy,
  }), [pagination.page, pagination.limit, selectedCategory, selectedBrands, selectedVendors, minPrice, priceRange, minRating, onlyInStock, featuredOnly, trendingOnly, flashDealsOnly, statusFilter, searchFilter, sortBy]);

  const categoryForValue = (value: string) => categories.find((category) => category.slug === value || category.id === value);
  const vendorForValue = (value: string) => vendors.find((vendor) => vendor.id === value);
  const brandFacets = facets.brands.length ? facets.brands : Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).map((value) => ({ value, label: value, count: products.filter((product) => product.brand === value).length }));
  const vendorFacets = facets.vendors.length ? facets.vendors : vendors.filter((vendor) => vendor.status === 'approved').map((vendor) => ({ value: vendor.id, label: vendor.businessName, count: products.filter((product) => product.vendorId === vendor.id).length }));
  const categoryFacets = facets.categories.length ? facets.categories : categories.map((category) => ({ value: category.slug, label: category.name, count: category.itemCount }));
  const hasActiveFilters = selectedCategory !== 'all' || selectedBrands.length > 0 || selectedVendors.length > 0 || minPrice > 0 || priceRange < DEFAULT_MAX_PRICE || minRating > 0 || onlyInStock || featuredOnly || trendingOnly || flashDealsOnly || statusFilter !== 'published' || searchFilter.trim() !== '';

  const loadCatalog = async () => {
    const requestId = `${pagination.page}:${pagination.limit}:${JSON.stringify(catalogParams)}:${aiSearchMode}`;
    setIsPageLoading(true);
    setError(null);
    try {
      let response: ProductListResponse;
      if (aiSearchMode && searchFilter.trim()) {
        try {
          const aiResponse = await aiAPI.search({ query: searchFilter.trim(), filters: catalogParams, limit: pagination.limit });
          response = {
            success: aiResponse.data.success,
            products: aiResponse.data.products,
            pagination: aiResponse.data.pagination || makePagination(pagination.page, pagination.limit, aiResponse.data.products.length),
            facets: aiResponse.data.facets || emptyFacets(),
          };
          setAiFallbackMessage(aiResponse.data.fallback ? aiResponse.data.message || 'AI search used the keyword fallback.' : null);
        } catch (aiError) {
          const fallbackResponse = await productsAPI.getAll(catalogParams);
          response = fallbackResponse.data;
          setAiFallbackMessage('AI search is temporarily unavailable. Showing keyword matches.');
        }
      } else {
        const result = await productsAPI.getAll(catalogParams);
        response = result.data;
      }

      if (!response.products) throw new Error('The catalog response did not include products.');
      setProducts(response.products);
      setFacets(response.facets || emptyFacets());
      setPagination((current) => response.pagination ? {
        ...response.pagination,
        hasPreviousPage: response.pagination!.page > 1,
        hasNextPage: response.pagination!.page < response.pagination!.totalPages,
      } : makePagination(current.page, current.limit, response.products.length));
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the catalog.');
      setIsLoading(false);
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCatalog();
    }, aiSearchMode ? 350 : 120);
    return () => window.clearTimeout(timer);
  }, [catalogParams, aiSearchMode, retryKey]);

  useEffect(() => {
    let active = true;
    const loadMetadata = async () => {
      try {
        const [categoryResponse, vendorResponse] = await Promise.all([categoriesAPI.getAll(), vendorsAPI.getAll()]);
        if (!active) return;
        setCategories(categoryResponse.data.categories || []);
        setVendors(vendorResponse.data.vendors || []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load catalog filters.');
      }
    };
    void loadMetadata();
    return () => {
      active = false;
    };
  }, [retryKey]);

  useEffect(() => {
    if (appliedInitialFilter || !initialFilter) return;
    if (initialFilter === 'deals') {
      setFlashDealsOnly(true);
    } else if (categories.some((category) => category.slug === initialFilter || category.id === initialFilter)) {
      setSelectedCategory(initialFilter);
    } else if (vendors.some((vendor) => vendor.id === initialFilter)) {
      setSelectedVendors([initialFilter]);
    } else {
      setSearchFilter(initialFilter);
    }
    setAppliedInitialFilter(true);
  }, [initialFilter, categories, vendors, appliedInitialFilter]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedBrands.length) params.set('brands', selectedBrands.join(','));
    if (selectedVendors.length) params.set('vendors', selectedVendors.join(','));
    if (minPrice > 0) params.set('minPrice', String(minPrice));
    if (priceRange < DEFAULT_MAX_PRICE) params.set('maxPrice', String(priceRange));
    if (minRating > 0) params.set('minRating', String(minRating));
    if (onlyInStock) params.set('inStock', '1');
    if (featuredOnly) params.set('featured', '1');
    if (trendingOnly) params.set('trending', '1');
    if (flashDealsOnly) params.set('flashDeal', '1');
    if (statusFilter !== 'published') params.set('status', statusFilter);
    if (searchFilter.trim()) params.set('q', searchFilter.trim());
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (aiSearchMode) params.set('ai', '1');
    if (pagination.page > 1) params.set('page', String(pagination.page));
    if (pagination.limit !== DEFAULT_LIMIT) params.set('limit', String(pagination.limit));
    const query = params.toString();
    const targetHash = `#catalog${query ? `?${query}` : ''}`;
    if (window.location.hash !== targetHash) {
      window.history.replaceState({ view: 'catalog' }, '', targetHash);
    }
  }, [selectedCategory, selectedBrands, selectedVendors, minPrice, priceRange, minRating, onlyInStock, featuredOnly, trendingOnly, flashDealsOnly, statusFilter, searchFilter, sortBy, aiSearchMode, pagination.page, pagination.limit]);

  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHashFilters();
      if (!parsed.hasQuery) return;
      setSelectedCategory(parsed.category || 'all');
      setSelectedBrands(parsed.brands || []);
      setSelectedVendors(parsed.vendors || []);
      setMinPrice(parsed.minPrice || 0);
      setPriceRange(parsed.maxPrice || DEFAULT_MAX_PRICE);
      setMinRating(parsed.minRating || 0);
      setOnlyInStock(parsed.inStock || false);
      setFeaturedOnly(parsed.featured || false);
      setTrendingOnly(parsed.trending || false);
      setFlashDealsOnly(parsed.flashDeal || false);
      setStatusFilter(parsed.status || 'published');
      setSearchFilter(parsed.search || '');
      setSortBy(parsed.sort || 'newest');
      setAiSearchMode(parsed.aiSearch || false);
      setPagination((current) => makePagination(parsed.page || 1, parsed.limit || DEFAULT_LIMIT, current.total));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!products.length) return;
    let active = true;
    recommendationsAPI.getForContext({ context: 'catalog', limit: 4 })
      .then((response) => {
        if (!active) return;
        setRecommendations(response.data.products || []);
        setRecommendationReasons(response.data.reasons || {});
      })
      .catch(() => {
        if (active) {
          setRecommendations(products.filter((product) => product.isFeatured || product.isTrending).slice(0, 4));
        }
      });
    return () => {
      active = false;
    };
  }, [products]);

  const trackEvent = (eventType: 'search' | 'product_view', metadata?: Record<string, string | number | boolean>) => {
    void eventsAPI.track({
      sessionId: localStorage.getItem('marketnexus_anonymous_id') || 'catalog-session',
      eventType,
      query: searchFilter.trim() || undefined,
      metadata,
    }).catch(() => undefined);
  };

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedBrands([]);
    setSelectedVendors([]);
    setMinPrice(0);
    setPriceRange(DEFAULT_MAX_PRICE);
    setMinRating(0);
    setOnlyInStock(false);
    setFeaturedOnly(false);
    setTrendingOnly(false);
    setFlashDealsOnly(false);
    setStatusFilter('published');
    setSearchFilter('');
    setSortBy('newest');
    setAiSearchMode(false);
    setAiFallbackMessage(null);
  };

  const toggleBrand = (brand: string) => setSelectedBrands((current) => current.includes(brand) ? current.filter((value) => value !== brand) : [...current, brand]);
  const toggleVendor = (vendorId: string) => setSelectedVendors((current) => current.includes(vendorId) ? current.filter((value) => value !== vendorId) : [...current, vendorId]);
  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setPagination((current) => ({ ...current, page: 1 }));
  };
  const changePage = (page: number) => {
    const nextPage = Math.min(Math.max(1, page), Math.max(1, pagination.totalPages || 1));
    setPagination((current) => ({ ...current, page: nextPage }));
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleVisualSearch = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setVisualError('Please choose a JPG, PNG, WebP, or AVIF image.');
      return;
    }
    setVisualLoading(true);
    setVisualError(null);
    try {
      const signatureResponse = await mediaAPI.getUploadSignature({
        filename: file.name,
        folder: 'visual-search',
        resourceType: 'image',
      });
      const uploaded = await mediaAPI.uploadToCloudinary(file, signatureResponse.data);
      const response = await aiAPI.visualSearch({
        mediaPublicId: uploaded.public_id,
        filters: catalogParams,
        limit: 8,
      });
      const visualResponse = response.data as VisualSearchResponse;
      setVisualResults(visualResponse.products || []);
      if (visualResponse.fallback) setVisualError(visualResponse.message || 'Visual search used a fallback index.');
      trackEvent('search', { visual: true, resultCount: visualResponse.products?.length || 0 });
    } catch (err) {
      setVisualError(err instanceof Error ? err.message : 'Visual search is currently unavailable.');
    } finally {
      setVisualLoading(false);
    }
  };

  const renderFilterPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
          <span>Filters</span>
        </h3>
        {hasActiveFilters && <button onClick={clearAllFilters} className="text-[11px] font-bold text-rose-600 hover:underline">Clear</button>}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Search Catalog</label>
        <div className="relative">
          <input
            type="text"
            value={searchFilter}
            onChange={(event) => {
              setSearchFilter(event.target.value);
              trackEvent('search', { ai: aiSearchMode });
            }}
            placeholder={aiSearchMode ? 'Describe what you need...' : 'Search specs, model...'}
            className="w-full bg-slate-50 text-slate-800 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
        <button
          onClick={() => setAiSearchMode((current) => !current)}
          className={`w-full flex items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-[11px] font-bold transition ${
            aiSearchMode ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-indigo-700 hover:bg-indigo-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> {aiSearchMode ? 'AI Search On' : 'Try AI Search'}
        </button>
        {aiFallbackMessage && <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">{aiFallbackMessage}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700">Category</label>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <button onClick={() => selectCategory('all')} className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${selectedCategory === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>All Categories</button>
          {categoryFacets.map((facet) => (
            <button key={facet.value} onClick={() => selectCategory(facet.value)} className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium transition flex items-center justify-between ${selectedCategory === facet.value ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
              <span>{facet.label}</span><span className="text-[10px] opacity-75">{facet.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700"><span>Price Range</span><span className="text-indigo-600 font-extrabold">Up to ₹{priceRange.toLocaleString('en-IN')}</span></div>
        <input type="range" min="5000" max={facets.priceRange.max || DEFAULT_MAX_PRICE} step="5000" value={Math.min(priceRange, facets.priceRange.max || DEFAULT_MAX_PRICE)} onChange={(event) => setPriceRange(Number(event.target.value))} className="w-full accent-indigo-600 cursor-pointer" />
        <div className="flex justify-between text-[10px] text-slate-400"><span>₹5,000</span><span>₹{(facets.priceRange.max || DEFAULT_MAX_PRICE).toLocaleString('en-IN')}</span></div>
        <input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(Math.max(0, Number(event.target.value)))} placeholder="Minimum price" className="w-full bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200 text-xs" />
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700">Brands</label>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {brandFacets.map((facet) => (
            <label key={facet.value} className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer">
              <input type="checkbox" checked={selectedBrands.includes(facet.value)} onChange={() => toggleBrand(facet.value)} className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 w-3.5 h-3.5" /><span>{facet.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700">Direct Merchants</label>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {vendorFacets.map((facet) => (
            <label key={facet.value} className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer">
              <input type="checkbox" checked={selectedVendors.includes(facet.value)} onChange={() => toggleVendor(facet.value)} className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 w-3.5 h-3.5" /><span className="truncate">{facet.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700">Minimum Rating</label>
        <div className="grid grid-cols-4 gap-1">{[4, 4.5, 4.8].map((rating) => <button key={rating} onClick={() => setMinRating(minRating === rating ? 0 : rating)} className={`py-1 rounded-lg text-xs font-bold border transition ${minRating === rating ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{rating}★+</button>)}</div>
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100">
        <label className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"><span>In-Stock Only</span><input type="checkbox" checked={onlyInStock} onChange={(event) => setOnlyInStock(event.target.checked)} className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" /></label>
        <label className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"><span>Featured</span><input type="checkbox" checked={featuredOnly} onChange={(event) => setFeaturedOnly(event.target.checked)} className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" /></label>
        <label className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"><span>Trending</span><input type="checkbox" checked={trendingOnly} onChange={(event) => setTrendingOnly(event.target.checked)} className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" /></label>
        <label className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"><span>Flash Deals</span><input type="checkbox" checked={flashDealsOnly} onChange={(event) => setFlashDealsOnly(event.target.checked)} className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" /></label>
        <label className="text-xs font-bold text-slate-700">Listing Status</label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ProductStatus | 'all')} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
          <option value="all">All statuses</option><option value="published">Published</option><option value="pending_review">Pending review</option><option value="draft">Draft</option><option value="archived">Archived</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading">{selectedCategory !== 'all' ? categoryForValue(selectedCategory)?.name || 'Category Catalog' : 'Marketplace Product Catalog'}</h1>
          <p className="text-xs text-slate-500 mt-1">Showing <span className="font-bold text-slate-800">{pagination.total || products.length}</span> products with multi-vendor dispatch</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setIsMobileFilterOpen(true)} className="md:hidden flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold transition"><Filter className="w-4 h-4" /><span>Filters</span></button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition"><Upload className="w-3.5 h-3.5" />Visual Search</button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(event) => { if (event.target.files?.[0]) { setVisualFile(event.target.files[0]); void handleVisualSearch(event.target.files[0]); } }} />
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs"><span className="text-slate-400 font-medium">Sort by:</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as ProductSort)} className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"><option value="newest">Newest Arrivals</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option><option value="rating">Customer Rating</option><option value="discount">Biggest Discount</option><option value="popularity">Popularity</option></select></div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200"><button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`} title="Grid View"><Grid className="w-4 h-4" /></button><button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`} title="List View"><List className="w-4 h-4" /></button></div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 bg-indigo-50/70 border border-indigo-100 p-3 rounded-2xl">
          <span className="text-xs font-bold text-indigo-900 mr-1 flex items-center gap-1"><SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />Active Filters:</span>
          {selectedCategory !== 'all' && <span className="inline-flex items-center gap-1 bg-white text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200">Category: {categoryForValue(selectedCategory)?.name || selectedCategory}<button onClick={() => setSelectedCategory('all')} className="hover:text-rose-500"><X className="w-3 h-3" /></button></span>}
          {selectedBrands.map((brand) => <span key={brand} className="inline-flex items-center gap-1 bg-white text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200">Brand: {brand}<button onClick={() => toggleBrand(brand)} className="hover:text-rose-500"><X className="w-3 h-3" /></button></span>)}
          {selectedVendors.map((vendorId) => <span key={vendorId} className="inline-flex items-center gap-1 bg-white text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200">Merchant: {vendorForValue(vendorId)?.businessName || vendorId}<button onClick={() => toggleVendor(vendorId)} className="hover:text-rose-500"><X className="w-3 h-3" /></button></span>)}
          {priceRange < DEFAULT_MAX_PRICE && <span className="inline-flex items-center gap-1 bg-white text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200">Max: ₹{priceRange.toLocaleString('en-IN')}<button onClick={() => setPriceRange(DEFAULT_MAX_PRICE)} className="hover:text-rose-500"><X className="w-3 h-3" /></button></span>}
          {minRating > 0 && <span className="inline-flex items-center gap-1 bg-white text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200">Rating: {minRating}★+<button onClick={() => setMinRating(0)} className="hover:text-rose-500"><X className="w-3 h-3" /></button></span>}
          {searchFilter && <span className="inline-flex items-center gap-1 bg-white text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200">Keyword: &quot;{searchFilter}&quot;<button onClick={() => setSearchFilter('')} className="hover:text-rose-500"><X className="w-3 h-3" /></button></span>}
          <button onClick={clearAllFilters} className="ml-auto text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"><RotateCcw className="w-3 h-3" /><span>Reset All</span></button>
        </div>
      )}

      {visualFile && (
        <div className="bg-white rounded-3xl border border-indigo-100 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0"><img src={URL.createObjectURL(visualFile)} alt="Visual search query" className="w-full h-full object-cover rounded-xl" /></div>
          <div className="flex-1 min-w-0"><h3 className="text-sm font-extrabold text-slate-900">Finding visually similar products</h3><p className="text-xs text-slate-500 mt-0.5">Your image is uploaded through the configured media signature flow and searched against catalog media.</p></div>
          {visualLoading ? <LoaderCircle className="w-5 h-5 text-indigo-600 animate-spin" /> : visualResults.length > 0 ? <span className="text-xs font-bold text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{visualResults.length} matches</span> : <span className="text-xs font-bold text-slate-500">Ready</span>}
          {visualError && <p className="text-[11px] text-rose-600 w-full">{visualError}</p>}
        </div>
      )}

      {visualResults.length > 0 && (
        <section className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-xl font-extrabold text-slate-900 font-heading">Visually Similar Products</h2><p className="text-xs text-slate-500">Matches ranked from your uploaded reference image</p></div><button onClick={() => { setVisualResults([]); setVisualFile(null); }} className="text-xs font-bold text-indigo-600">Clear results</button></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{visualResults.map((product) => <ProductCard key={product.id} product={product} onNavigate={onNavigate} />)}</div></section>
      )}

      {error ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-rose-200 space-y-4"><AlertCircle className="w-10 h-10 text-rose-500 mx-auto" /><h3 className="text-base font-bold text-slate-900">Catalog unavailable</h3><p className="text-xs text-slate-500">{error}</p><button onClick={() => { setError(null); setRetryKey((current) => current + 1); }} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl">Retry Catalog</button></div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 6 }, (_, index) => <ProductSkeleton key={index} />)}</div>
      ) : (
        <>
          {recommendations.length > 0 && products.some((product) => recommendations.some((recommended) => recommended.id === product.id)) === false && (
            <section className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-xl font-extrabold text-slate-900 font-heading flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" />Recommended for You</h2><p className="text-xs text-slate-500">Personalized picks from your marketplace activity</p></div><button onClick={() => onNavigate('catalog')} className="text-xs font-bold text-indigo-600">Explore Catalog</button></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{recommendations.map((product) => <ProductCard key={product.id} product={product} onNavigate={onNavigate} reason={recommendationReasons[product.id]} />)}</div></section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <aside className="hidden md:block md:col-span-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs sticky top-28">{renderFilterPanel()}</aside>
            <div className="md:col-span-9 space-y-6">
              {products.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4"><div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto"><Search className="w-8 h-8" /></div><h3 className="text-base font-bold text-slate-900">No matching products found</h3><p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Try adjusting your price range, clearing brand filters, or searching with broader terms.</p><button onClick={clearAllFilters} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl">Reset All Filters</button></div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{products.map((product) => <ProductCard key={product.id} product={product} onNavigate={onNavigate} />)}</div>
              ) : (
                <div className="space-y-4">{products.map((product) => <ProductCard key={product.id} product={product} onNavigate={onNavigate} viewMode="list" />)}</div>
              )}

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2"><button onClick={() => changePage(pagination.page - 1)} disabled={!pagination.hasPreviousPage} className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button><span className="text-xs font-bold text-slate-700 px-3">Page {pagination.page} of {pagination.totalPages}</span><button onClick={() => changePage(pagination.page + 1)} disabled={!pagination.hasNextPage} className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button></div>
              )}
              {isPageLoading && <div className="flex items-center justify-center gap-2 text-xs text-slate-500"><LoaderCircle className="w-4 h-4 animate-spin text-indigo-600" />Refreshing catalog...</div>}
            </div>
          </div>
        </>
      )}

      {isMobileFilterOpen && <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-stretch justify-end"><div className="bg-white w-full max-w-sm h-full overflow-y-auto p-5 space-y-6 animate-in slide-in-from-right"><div className="flex items-center justify-between"><h2 className="text-base font-extrabold text-slate-900">Catalog Filters</h2><button onClick={() => setIsMobileFilterOpen(false)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button></div>{renderFilterPanel()}<button onClick={() => setIsMobileFilterOpen(false)} className="w-full bg-indigo-600 text-white text-xs font-bold py-3 rounded-xl">Show {pagination.total || products.length} Products</button></div></div>}
    </div>
  );
};
