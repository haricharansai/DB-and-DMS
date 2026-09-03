import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  Truck,
  Heart,
  GitCompare,
  ShoppingBag,
  Zap,
  RotateCcw,
  CheckCircle2,
  Store,
  ChevronRight,
  Send,
  User as UserIcon,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { productsAPI, reviewsAPI } from '../../services/api';
import { Product, Vendor, Review } from '../../types';
import { useCart } from '../../context/CartContext';
import { useComparison } from '../../context/ComparisonContext';
import { useAuth } from '../../context/AuthContext';

interface ProductDetailViewProps {
  productId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ productId, onNavigate }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  // Review Form State
  const [newRating, setNewRating] = useState<number>(5);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { addToCompare, isInCompare } = useComparison();
  const { user, openAuthModal, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setIsLoading(true);
        const res = await productsAPI.getById(productId);
        if (res.data.product) {
          setProduct(res.data.product);
          setSelectedImage(res.data.product.images[0] || res.data.product.thumbnail);
          setSelectedColor(res.data.product.colors?.[0] || 'Default');
        }
        if (res.data.vendor) setVendor(res.data.vendor);
        if (res.data.reviews) setReviews(res.data.reviews);
      } catch (err) {
        console.error('Failed to load product details', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductDetails();
  }, [productId]);

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity, selectedColor);
    onNavigate('checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!newComment.trim() || !product) return;

    try {
      setIsSubmittingReview(true);
      const res = await reviewsAPI.create({
        productId: product.id,
        rating: newRating,
        title: newTitle || 'Product Experience',
        comment: newComment,
      });

      if (res.data.review) {
        setReviews(prev => [res.data.review, ...prev]);
        setNewComment('');
        setNewTitle('');
        setNewRating(5);
      }
    } catch (err) {
      console.error('Failed to submit review', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading || !product) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading product specifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => onNavigate('catalog')}
          className="flex items-center gap-1 hover:text-indigo-600 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </button>
        <span>/</span>
        <span className="capitalize">{product.category}</span>
        <span>/</span>
        <span className="font-bold text-slate-800 truncate max-w-md">{product.title}</span>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs">
        {/* Left: Interactive Media Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="h-96 sm:h-[420px] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-6 relative overflow-hidden group">
            {product.discountPercentage > 0 && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                {product.discountPercentage}% OFF
              </span>
            )}
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition ${
                isInWishlist(product.id)
                  ? 'bg-rose-50 text-rose-500 shadow-md'
                  : 'bg-white/90 text-slate-500 hover:text-rose-500 shadow-sm'
              }`}
            >
              <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-rose-500' : ''}`} />
            </button>
            <img
              src={selectedImage}
              alt={product.title}
              className="max-h-full object-contain transition-all duration-300 group-hover:scale-105"
            />
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xl bg-slate-50 border-2 overflow-hidden shrink-0 transition ${
                    selectedImage === img ? 'border-indigo-600 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details, Vendor Box, & Actions */}
        <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                {product.brand}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({product.stock} units)
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading leading-tight">
              {product.title}
            </h1>

            {/* Ratings & Reviews Count */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-amber-700 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{product.rating}</span>
              </div>
              <span className="text-slate-500 font-medium">({product.reviewsCount} Customer Reviews)</span>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-600 font-semibold">100% Genuine Direct Supply</span>
            </div>

            {/* Price Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-baseline justify-between">
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-slate-900 font-heading">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-sm text-slate-400 line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">Inclusive of all taxes & GST. Free Multi-Vendor Delivery.</p>
              </div>
            </div>

            {/* Color Variants */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  Select Color: <span className="text-indigo-600">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                        selectedColor === c
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>

            {/* Direct Vendor Profile Card */}
            {vendor && (
              <div className="bg-gradient-to-r from-indigo-50/50 to-slate-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={vendor.logo}
                    alt={vendor.businessName}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900">{vendor.businessName}</h4>
                      {vendor.isVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" title="Verified KYC Merchant" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>★ {vendor.rating} Seller Rating</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-medium">{vendor.dispatchTime}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('catalog', vendor.id)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
                >
                  Visit Store →
                </button>
              </div>
            )}
          </div>

          {/* Action Row: Quantity + Add to Cart + Buy Now */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-4">
              {/* Stepper */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold"
                >
                  -
                </button>
                <span className="w-10 text-center text-xs font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={() => addToCart(product, quantity, selectedColor)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart (₹{(product.price * quantity).toLocaleString('en-IN')})</span>
              </button>

              {/* Buy Now */}
              <button
                onClick={handleBuyNow}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>
            </div>

            {/* Compare Button */}
            <button
              onClick={() => addToCompare(product)}
              className={`w-full py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                isInCompare(product.id)
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>{isInCompare(product.id) ? 'Product in Comparison Matrix' : 'Add to Specification Comparison'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Specifications Breakdown Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        <h3 className="text-lg font-extrabold text-slate-900 font-heading">Technical Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {Object.entries(product.specs || {}).map(([key, val]) => (
            <div key={key} className="flex justify-between py-2 border-b border-slate-100 text-xs">
              <span className="font-semibold text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className="font-bold text-slate-900 text-right">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 font-heading">Customer Reviews & Ratings</h3>
            <p className="text-xs text-slate-500">Real feedback from verified purchasers</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-3xl font-extrabold text-slate-900 font-heading">{product.rating}</div>
            <div className="text-xs space-y-0.5">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                ))}
              </div>
              <p className="text-slate-400 text-[11px]">Based on {reviews.length} reviews</p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h4 className="text-xs font-bold text-slate-800">Write a Customer Review</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Your Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setNewRating(star)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`w-4 h-4 ${
                      star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Headline / Summary (e.g. Best wireless audio experience!)"
              className="w-full bg-white text-slate-800 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your detailed feedback on battery, build quality, and dispatch SLA..."
              className="w-full bg-white text-slate-800 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingReview}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmittingReview ? 'Submitting Review...' : 'Submit Verified Review'}</span>
          </button>
        </form>

        {/* Reviews List */}
        <div className="space-y-4 divide-y divide-slate-100">
          {reviews.map((rev) => (
            <div key={rev.id} className="pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={rev.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                    alt={rev.userName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">{rev.userName}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                      </span>
                      <span>•</span>
                      <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-amber-500">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-500" />
                  ))}
                </div>
              </div>

              <h6 className="text-xs font-bold text-slate-900">{rev.title}</h6>
              <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
